import {createContext, useContext, useEffect, useState} from "react";
import {
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    sendPasswordResetEmail
} from 'firebase/auth';
import {auth} from '../config/firebase';
import {User, UserCredential} from "@firebase/auth/dist/auth-public";
import {postRequestRBAC} from "../api/postRequestRBAC";
import {GlobalStateContext} from "./GlobalContext";


//User login credentials and functionality

type UserAuthContextType = {
    user: User | undefined | null
    logout: () => Promise<void>
    signInEmailPassword: (email: string, password: string) => Promise<UserCredential>
    signInWithGoogle: () => Promise<UserCredential>
    permissions: string[][]
    can: (action: string, object: string) => boolean
    forgotPassword: (email: string) => Promise<void>
}

const UserAuthContext = createContext<UserAuthContextType>({
    user: null,
    logout: () => new Promise<void>(() => false),
    signInEmailPassword: (email, password) => new Promise<UserCredential>(() => false),
    signInWithGoogle: () => new Promise<UserCredential>(() => false),
    permissions: [],
    can: (action, object) => false,
    forgotPassword: (email) => new Promise<void>(() => false),
})

export const UserAuthContextProvider = ({children}: any) => {
    const [user, setUser] = useState<User | undefined | null>(undefined);
    const [permissions, setPermissions] = useState<string[][]>([]);
    const {authorizing, setAuthorizing} = useContext(GlobalStateContext);

    const signInWithGoogle = () => {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider)
    };


    const signInEmailPassword = (email: string, password: string) => {
        return signInWithEmailAndPassword(auth, email, password)
    }

    const logout = () => {
        return signOut(auth)
    }

    const forgotPassword = (email: string) => {
        return sendPasswordResetEmail(auth, email)
    }

    const fetchUserPermissions = async () => {
        try {
            const res = await postRequestRBAC('/api/casbin/permissions')
            const resPermissions = res.data || []
            setPermissions(resPermissions)
            setAuthorizing!(false)
        } catch (e: any) {
            console.log(e)
            setPermissions([])
            setAuthorizing!(false)
            // console.log(e.response.data.message)
        }
    }

    const can = (action: string, object: string): boolean => {
        if (!permissions)
            return false

        for (const permission of permissions) {
            const permRole = permission[0]
            const permObject = permission[1]
            const permAction = permission[2]
            if (permAction == action && permObject == object)
                return true
        }

        return false
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            // console.log(currentUser);
            setUser(currentUser);

            if (currentUser) {
                // fetch their permissions
                fetchUserPermissions()
            } else {
                setPermissions([])
                setAuthorizing!(false)
            }

        });
        return () => {
            unsubscribe();
        };
    }, []);


    return (
        <UserAuthContext.Provider
            value={{user, logout, signInEmailPassword, signInWithGoogle, permissions, can, forgotPassword}}>
            {children}
        </UserAuthContext.Provider>
    )
}

export const UserAuth = () => {
    return useContext(UserAuthContext)
}