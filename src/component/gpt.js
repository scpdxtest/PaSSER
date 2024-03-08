import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import axios from 'axios';
import { Tooltip } from 'primereact/tooltip';
import { SplitButton } from 'primereact/splitbutton';
import './gpt.css';
import { ProgressSpinner } from 'primereact/progressspinner';

const Gpt = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [dialogVisible, setDialogVisible] = useState(true);
    const [selectedModel, setSelectedModel] = useState(localStorage.getItem("selectedLLMModel") || 'mixtral');
    const [selectedOllama, setSelectedOllama] = useState(localStorage.getItem("selectedOllama") || 'http://127.0.0.1:11434');
    const [stat, setStat] = useState('');
    const [buffer, setBuffer] = useState([]);
    const [isAnswering, setIsAnswering] = useState(false);

    useEffect(() => {
        setDialogVisible(true);
    }, []);

    const handleSubmit = async () => {
        setIsAnswering(true);
        const question = newMessage;
        setNewMessage('');
        setStat('');
        setMessages([...messages, { text: question, sender: 'user', stat: '' }, { text: '', sender: selectedModel, stat: '' }]);

        let partialResponse = '';

        try {
            await axios.post(selectedOllama + '/api/generate', {"model": selectedModel, "prompt": question, "stream": true, "context": buffer }, {
                onDownloadProgress: (progressEvent) => {
                    partialResponse += progressEvent.event.target.responseText;

                    let lastOpenBracket = partialResponse.lastIndexOf('{');
                    let lastCloseBracket = partialResponse.lastIndexOf('}');

                    if (lastOpenBracket !== -1 && lastCloseBracket > lastOpenBracket) {
                        const completeResponse = partialResponse.slice(lastOpenBracket, lastCloseBracket + 1);
                        partialResponse = partialResponse.slice(lastCloseBracket + 1);

                        let responseObject;
                        try {
                            responseObject = JSON.parse(completeResponse);
                        } catch (error) {
                            responseObject = {created_at: '', model: selectedModel, sender: selectedModel, response: '', stat: ''};
                        }
                        if (responseObject.response) {
                            setMessages(prevMessages => {
                                let newMessages = [...prevMessages];
                                if (newMessages.length >= 0 && newMessages[newMessages.length - 1].sender === selectedModel) {
                                    newMessages[newMessages.length - 1].text += responseObject.response;
                                } else {
                                    newMessages.push({ text: responseObject.response, sender: selectedModel, stat: '' });
                                }
                                responseObject.response = ''; 
                                return newMessages;
                            });
                        } else {
                            if (responseObject.context) {
                                setStat("\nTokens per sec: " + (Number(responseObject.eval_count) / Number(responseObject.eval_duration) * 1e9).toString());
                                    setBuffer([...buffer, ...responseObject.context]); 
                                setMessages(prevMessages => {
                                    let newMessages = [...prevMessages];
                                    newMessages[newMessages.length - 1].stat = "\nTokens per sec: " + (Number(responseObject.eval_count) / Number(responseObject.eval_duration) * 1e9).toString()
                                    return newMessages;
                                });
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error while sending question to Ollama:', error);
        }
        setIsAnswering(false);
    };

    const copyToClipboard = (textToCopy) => {
        navigator.clipboard.writeText(textToCopy);
    };

    const handleNew = () => {
        setBuffer([]);
    };

    const saveContext = () => {
        const filename = window.prompt("Enter filename");
        if (filename) {
            const bufferString = buffer.join(',');
            const blob = new Blob([bufferString], {type: "text/plain;charset=utf-8"});
            const href = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = href;
            link.download = filename + ".context";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const loadContext = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.context';
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const data = e.target.result.split(',').map(Number);
                    setBuffer(data);
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    const items = [
        {label: 'Load', icon: 'pi pi-fw pi-file-import', command: () => {console.log("Load"); loadContext(); console.log("buffer", buffer);}},
        {label: 'Clear', icon: 'pi pi-fw pi-trash', command: () => {handleNew()}},
        {label: 'Save', icon: 'pi pi-fw pi-save', command: () => {console.log("Save"); saveContext()}}
    ];

    return (
        <Dialog header="Chat with private LLM" visible={dialogVisible} style={{ width: '98%' }} modal={true} onHide={() => {setDialogVisible(false)}}>
            {messages.map((message, index) => (
                <div key={index}>
                    <pre style={{ textOverflow: 'ellipsis', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                        <b>{message.sender}:</b> {message.text}
                        {message.stat ? <span style={{ color: 'blue' }}>{message.stat}</span> : null}
                    </pre>
                    <Button icon="pi pi-copy" 
                            className="p-button-sm p-button-success p-button-outlined" 
                            style={{ fontSize: '0.6rem', padding: '0.2rem', top: '-0.9rem'}} 
                            onClick={() => copyToClipboard(`${message.sender}: ${message.text}`)} />                
                </div>
            ))}
            <div className="p-d-flex p-ai-center p-mt-2">
                <InputText 
                    style={{ width: '75%' }}
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)} 
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handleSubmit();
                        }
                    }} 
                    placeholder="Enter your question" 
                />
                <Button label="Ask" onClick={handleSubmit} className="p-ml-2" />
                <SplitButton id='contextButton' style={{marginLeft: '20px', backgroundColor: '#FF6961'}} label="Context" icon="pi pi-ellipsis-v" model={items} className="split-button" />
                {buffer.length > 0 && <i className="pi pi-slack" style={{fontSize: '2em', color: 'green', marginLeft: '10px'}} />}
                <Tooltip target="#contextButton" content="Load previously stored context, Clear context and start new chat, Save current context" />
                {isAnswering ? <ProgressSpinner style={{ width: '50px', height: '50px', marginLeft: '10px', width: '2em', height: '2em'}} strokeWidth="8"/> : null}      
            </div>
        </Dialog>
    );
};

export default Gpt;
