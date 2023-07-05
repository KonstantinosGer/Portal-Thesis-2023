import React, {createContext, Dispatch, SetStateAction, useRef, useState} from 'react';
import {ActionType} from "@ant-design/pro-components";

//create a context, with createContext api
type ContextType = {
    authorizing?: boolean
    setAuthorizing?: Dispatch<SetStateAction<boolean>>
}

export const GlobalStateContext = createContext<ContextType>({});


const GlobalStateProvider = ({children}: any) => {
    // this state will be shared with all components
    const [authorizing, setAuthorizing] = useState<boolean>(true);

    return (
        // this is the provider providing state
        <GlobalStateContext.Provider value={{
            authorizing,
            setAuthorizing,
        }}>
            {children}
        </GlobalStateContext.Provider>
    );
};

export default GlobalStateProvider;