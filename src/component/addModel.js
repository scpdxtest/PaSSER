import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import axios from 'axios';
import { ProgressBar } from 'primereact/progressbar';

const AddModel = () => {
    const [modelName, setModelName] = useState('');
    const [selectedOllama, setSelectedOllama] = useState(null);
    const [total, setTotal] = useState(0);
    const [completed, setCompleted] = useState(0);
    const [bars, setBars] = useState([]);
    const [existingBar, setExistingBars] = useState(false);
    const [currentStatus, setCurrentStatus] = useState('');

    useEffect(() => {
        const ol = localStorage.getItem("selectedOllama") || 'http://127.0.0.1:11434';
        setSelectedOllama(ol);
        var matchFlag = false;
        bars.forEach(bar => {
            if (bar.pull_name && bar.pull_name === currentStatus) {
                matchFlag = true;
            }
        });
        if (!matchFlag) {
            const tempBar = { pull_name: currentStatus, total: total, completed: completed };
            setBars([...bars, tempBar]);
        }
        setExistingBars(matchFlag);
    }, [currentStatus]);

    const handlePull = async () => {
        let partialResponse = '';

        try {
            await axios.post(selectedOllama + '/api/pull', {name: modelName, strem: true}, {
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
                            const stat = responseObject.status.toString();
                            if (stat.includes('pulling') && stat !== 'pulling manifest') {
                                setCurrentStatus(stat);
                                setTotal(responseObject.total);
                                setCompleted(responseObject.completed);
                                if (existingBar) {
                                    if (responseObject.completed <= responseObject.total) {
                                        setBars(bars.map(bar =>
                                            bar.name === responseObject.status
                                                ? { ...bar, total: responseObject.total, completed: responseObject.completed }
                                                : bar
                                        ));
                                    };
                                }
                            } else {
                            }
                        } catch (error) {
                            console.log("error parse", error);
                        }

                    }
                }
            });
        } catch (err) {
            console.log(err);
            alert("Ollama LLM is not available");   
        };
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div >
                <InputText 
                    value={modelName} 
                    onChange={(e) => setModelName(e.target.value)}
                    spellCheck={false} 
                />
                <Button label="Pull" style={{marginLeft: '20px'}} onClick={handlePull} />
                <Button label="Cancel" style={{marginLeft: '20px'}} onClick={() => {/* handle cancel action */}} />
            </div>

            {Array.from({length: bars.length-1}, (_, index) => (
                    <div style={{marginTop: '5px', width: '90%', justifyItems: 'center'}}>
                        <ProgressBar 
                            key={index}
                            value={((completed / total) * 100).toFixed(2)} 
                        />
                        <p style={{width: '90%', justifyItems: 'center'}}>{bars[index].pull_name}</p>
                    </div>
            ))}

        </div>
    );
}

export default AddModel;
