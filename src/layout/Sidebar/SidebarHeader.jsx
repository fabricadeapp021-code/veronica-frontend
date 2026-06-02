// import { ArrowBarToLeft } from 'tabler-icons-react';
// import { Button } from 'react-bootstrap';
// import Link from 'next/link';
// import Image from 'next/image';
// import { useGlobalStateContext } from '@/context/GolobalStateProvider';
// //Images
// import logo from '@/assets/img/logo-governa-ia.svg';
// import logoIcon from '@/assets/img/logo-brand-governa-ai.svg';

// const SidebarHeader = () => {
//     const { states, dispatch } = useGlobalStateContext();
    
//     const isCollapsed = states?.layoutState?.isSidebarCollapsed || false;

//     const toggleSidebar = () => {
//         dispatch({ type: 'sidebar_toggle' });
//     }

//     return (
//         <div className="menu-header">
//             <span>
//                 {/* Logo completo quando sidebar está ABERTO */}
//                 {!isCollapsed ? (
//                     <Link className="navbar-brand" href="/dashboard-analytics">
//                         <Image 
//                             className="brand-img img-fluid" 
//                             src={logo} 
//                             alt="GovernAI" 
//                             width={125}
//                             height={29}
//                             priority
//                         />
//                     </Link>
//                 ) : (
//                     /* Logo pequeno quando sidebar está FECHADO */
//                     <Link className="navbar-brand d-flex justify-content-center" href="/dashboard-analytics">
//                         <Image 
//                             className="brand-img img-fluid" 
//                             src={logoIcon} 
//                             alt="GovernAI" 
//                             width={40}
//                             height={40}
//                             priority
//                         />
//                     </Link>
//                 )}

//                 <Button variant="flush-dark" onClick={toggleSidebar} className="btn-icon btn-rounded flush-soft-hover navbar-toggle">
//                     <span className="icon">
//                         <span className="svg-icon fs-5">
//                             <ArrowBarToLeft />
//                         </span>
//                     </span>
//                 </Button>
//             </span>
//         </div>
//     )
// }


// export default SidebarHeader


import { ArrowBarToLeft } from 'tabler-icons-react';
import { Button } from 'react-bootstrap';
import Link from 'next/link';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';
import ProvisionalBrand from '@/components/ProvisionalBrand';

const SidebarHeader = ({ isSidebarHovered = false }) => {
    const { states, dispatch } = useGlobalStateContext();

    const toggleSidebar = () => {
        dispatch({ type: 'sidebar_toggle' });
    };

    return (
        <div className="menu-header">
            <span>
                <ProvisionalBrand
                    href="/apps/users/list"
                    compact={states.layoutState.isSidebarCollapsed && !isSidebarHovered}
                    className="navbar-brand"
                />
                <Button variant="flush-dark" onClick={toggleSidebar} className="btn-icon btn-rounded flush-soft-hover navbar-toggle">
                    <span className="icon">
                        <span className="svg-icon fs-5">
                            <ArrowBarToLeft />
                        </span>
                    </span>
                </Button>
            </span>
        </div>
    )
}


export default SidebarHeader
