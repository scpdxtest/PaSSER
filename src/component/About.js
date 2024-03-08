import {useEffect, useState, useContext} from "react";
import backgroundImage from './PasserLogo4_GPT.png';

const About = () => {
      
    useEffect(() => {
    }, []);
    
    return(
        <div style={{ color: 'white', backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center center', height: '100vh', width: '100%'}}>
            <h1>
                PaSSER
            </h1>

        </div>
    )
}

export default About;