import {useEffect} from "react";
import backgroundImage from './PasserLogo4_GPT.png';

const About = () => {
    const hello = 'Welcome to PaSSER: Platform for Retrieval-Augmented Generation';
    const about1 = 'PaSSER is an web application designed for implementing and testing Retrieval-Augmented Generation (RAG) models. It offers a user-friendly interface for adaptive testing across various scenarios, integrating large language models (LLMs) like Mistral:7b, Llama2:7b, and Orca2:7b.';
    const about2 = 'PaSSER provides a comprehensive set of standard Natural Language Processing (NLP) metrics, facilitating thorough evaluation of model performance.';
    const about3 = 'The platform fosters collaboration and transparency within the research community, empowering users to contribute to the advancement of language model research and development.'
    const about4 = 'This work was supported by the Bulgarian Ministry of Education and Science under the National Research Program “Smart crop production” approved by the Ministry Council No. 866/26.11.2020.'
      
    useEffect(() => {
    }, []);
    
    return(
        <div style={{ display: 'flex', height: '100vh', width: '100%'}}>
            <div style={{ flex: '50%', backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center center'}}>
            </div>
            <div style={{ flex: '50%', backgroundColor: 'white', color: 'black', padding: '20px' }}>
                <div>
                    <h1>
                        {hello}
                    </h1>
                </div>
                <div>
                    <h2 style={{ fontSize: '1.5em', fontWeight: 'normal', color: 'gray' }}>
                        {about1}
                    </h2>
                </div>
                <div>
                    <h2 style={{ fontSize: '1.5em', fontWeight: 'normal', color: 'gray' }}>
                        {about2}
                    </h2>
                </div>
                <div>
                    <h2 style={{ fontSize: '1.5em', fontWeight: 'normal', color: 'gray' }}>
                        {about3}
                    </h2>
                </div>
                <div style={{color: 'gray'}}>
                    {about4}
                </div>
            </div>
        </div>
    )}

export default About;