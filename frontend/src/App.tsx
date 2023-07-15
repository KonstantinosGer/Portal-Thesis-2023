import React, {createContext, useContext} from 'react';
import './App.css';
import {Navigate, Route, Routes, useLocation} from 'react-router-dom';
import {MyLayout} from "./components/MyLayout";
import PrivateRoutes from "./components/PrivateRoutes";
import {UserLogin} from "./pages/UserLogin";
import ForgotPassword from "./pages/ForgotPassword";
import NoFoundPage from "./pages/404";
import Authorizer from "./api/Authorizer";
import {GlobalStateContext} from "./context/GlobalContext";
import {PageLoading} from "@ant-design/pro-layout";
import FileApproval from "./components/FileApproval";
import PerformanceReports from "./components/PerformanceReports";
import FinancialReports from "./components/FinancialReports";
import {UserAuth} from "./context/AuthContext";
import UnauthorizedPage from "./pages/403";
import {Access} from "./components/Access";


export const AuthorizerContext = createContext<Authorizer | undefined>(undefined)

function App() {
    const location = useLocation();
    const background = location.state && location.state.background;
    const {authorizing} = useContext(GlobalStateContext);
    const {can, user} = UserAuth();

    if (authorizing) {
        return <PageLoading/>
    }

    return (
        <div className="App">
            <Routes location={background || location}>
                <Route element={<PrivateRoutes/>}>
                    <Route element={<MyLayout/>}>
                        {/*////////////////*/}
                        {/*//// Routes ////*/}
                        {/*////////////////*/}

                        <Route path='/fileapproval' element={
                            <Access accessible={can('read', 'portal::data::manager')} fallback={<><UnauthorizedPage/></>}>
                            <FileApproval/>
                            </Access>
                        }/>

                        <Route path='/reports/performance' element={
                            <Access accessible={can('read', 'portal::data::customer::performance')} fallback={<><UnauthorizedPage/></>}>
                                <PerformanceReports/>
                            </Access>
                        }/>

                        <Route path='/reports/financial' element={
                            <Access accessible={can('read', 'portal::data::customer::finance')} fallback={<><UnauthorizedPage/></>}>
                            <FinancialReports/>
                            </Access>
                        }/>


                        {/*//////////////////*/}
                        {/*//// Navigate ////*/}
                        {/*//////////////////*/}
                        <Route path='/' element={
                            can('read', 'portal::data::customer::performance') ? <Navigate to={'/reports/performance'}/> :
                                can('read', 'portal::data::customer::finance') ?
                                    <Navigate to={'/reports/financial'}/> :
                                    can('read', 'portal::data::manager') ? <Navigate to={'/fileapproval'}/> :
                                        <UnauthorizedPage/>
                        }/>

                    </Route>
                </Route>
                <Route path='/login' element={<UserLogin/>}/>
                <Route path='/forgot-password' element={<ForgotPassword/>}/>
                <Route path='*' element={<NoFoundPage/>}/>
            </Routes>
        </div>
    );
}

export default App;
