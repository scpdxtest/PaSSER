import { Menubar } from 'primereact/menubar';
// import "primereact/resources/themes/vela-blue/theme.css"; // edit vela-blue to change theme
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { useState, useEffect } from 'react';
import { blueFontSmall } from './mylib';     
import {checkBCEndpoint, checkIPFSEndpoint} from './BCEndpoints.js';
import aboutIcon from './about.png';
import './Nav.css';
import testingIcon from './testing_icon-icons.com_72182.png'
import loginIcon from './Login_37128.png'

const Navigation = () => {
    const [selectedModel, setSelectedModel] = useState(localStorage.getItem("selectedLLMModel") || 'Default -> mixtral');
    const [selectedOllama, setSelectedOllama] = useState(localStorage.getItem("selectedOllama") || 'http://');
    const [ChromaDBPath, setChromaDBPath] = useState(localStorage.getItem("selectedChromaDB") || 'http://');

    useEffect(() => {
        checkBCEndpoint().then(async (res) => {
            localStorage.setItem("bcEndpoint", res);
        });
        checkIPFSEndpoint().then(async (res) => {
            localStorage.setItem("ipfsEndpoint_host", res.host);
            localStorage.setItem("ipfsEndpoint_port", res.port);
        });
    }, []);

    const navlist = [
      {label: 'About', icon: <img src={aboutIcon} alt="About" width="22" height="22"/>, command: () =>{
        window.location.href='./#/about'
      }},
        {label: 'Create Vectorstore', icon: <span style={{color: 'red'}} className='pi pi-fw pi-plus'></span>, 
            items: [    
                {
                    label: 'From Text', icon: <span style={{color: 'red'}} className='pi pi-fw pi-plus'></span>, command: () => {
                    window.location.href='./#/dbfromtext'
                    }
                }, 
                {
                    label: 'From PDF', icon: <span style={{color: 'red'}} className='pi pi-fw pi-plus'></span>, command: () => {
                    window.location.href='./#/dbfrompdf'
                    }
                }, 
                {
                    label: 'From WEB', icon: <span style={{color: 'red'}} className='pi pi-fw pi-plus'></span>, command: () => {
                    window.location.href='./#/dbfromweb'
                    }
                }
            ]
        },
        {label: 'Chat', icon: <span style={{color: 'green'}} className='pi pi-fw pi-comment'></span>, 
            items: [
                {
                    label: 'Chat with LLM', icon: <span style={{color: 'green'}} className='pi pi-fw pi-comment'></span>, command: () => {
                    window.location.href='./#/gpt'
                    }
                },
                {
                    label: 'RAG Q&A with LLM', icon: <span style={{color: 'green'}} className='pi pi-fw pi-comment'></span>, command: () => {
                    window.location.href='./#/chatfromdb'
                    }
                }
            ]
        },
        {label: 'Tests', icon: <img src={testingIcon} alt="About" width="20" height="20"/>, 
            items: [
                {
                    label: 'Q&A Dataset', icon: <span style={{color: 'green'}} className='pi pi-fw pi-align-center'></span>, command: () => {
                    window.location.href='./#/qatest'
                    }
                },
                {
                    label: 'RAG Q&A score test', icon: <span style={{color: 'green'}} className='pi pi-fw pi-exclamation-circle'></span>, command: () => {
                    window.location.href='./#/testRAGbat'
                    }
                },
                {
                    label: 'Show Test Results', icon: <span style={{color: 'green'}} className='pi pi-fw pi-table'></span>, command: () => {
                    window.location.href='./#/showTestResults'
                    }
                },
                {
                    label: 'Q&A Time LLM tests', icon: <span style={{color: 'green'}} className='pi pi-fw pi-clock'></span>, command: () => {
                    window.location.href='./#/testtimebat'
                    }
                },
                {
                    label: 'Show Time Test Results', icon: <span style={{color: 'green'}} className='pi pi-fw pi-table'></span>, command: () => {
                    window.location.href='./#/showTimeTestResults'
                    }
                }
            ]
        },
        {label: 'Configuration', icon: <span style={{color: 'blue'}} className= 'pi pi-fw pi-sliders-h'></span>, 
            items: [
                {
                    label: 'Settings', icon: <span style={{color: 'blue'}} className= 'pi pi-fw pi-sliders-h'></span>, command: () => {
                    window.location.href='./#/selectmodel'
                    }
                },
                {
                    label: 'Add Model', icon: <span style={{color: 'blue'}} className= 'pi pi-fw pi-sliders-h'></span>, command: () => {
                    window.location.href='./#/addmodel'
                    }
                }
            ]
        },
        { label: 'ManageDB', icon: 'pi pi-fw pi-server', command: () =>{
            window.location.href='./#/managedb'
        }}, 
        { label: 'AnchorLogin', icon: <img src={loginIcon} alt="About" width="20" height="20"/>, command: () =>{
            window.location.href='./#/testwharf'
        }}, 
    ];

    return(

        <header>
            <nav>
                <ul>
                    <Menubar 
                        model={navlist} 
                        end={
                            <div>
                                <div style={blueFontSmall}><b>OllamaAPI:</b>{selectedOllama} | <b>Model:</b>{selectedModel}</div>
                                <div style={blueFontSmall}><b>ChromaAPI:</b>{ChromaDBPath} | <b>BCName:</b>{localStorage.getItem('wharf_user_name')}</div>
                            </div>
                        }
                    />
                </ul>
            </nav>
         </header>


        // <div style={{ display: 'flex', width: '100%'}}>
        //     <div style={{width: '10%', display: 'flex'}} >
        //         <TieredMenu model={navlist} />
        //         <span style={{marginLeft: '20px'}}>
        //             <div style={blueFontSmall}>
        //                 <br/>
        //                 {selectedOllama} | {selectedModel} | {ChromaDBPath}
        //             </div>
        //         </span>
        //     </div>
        // </div>
    )

}

export default Navigation;