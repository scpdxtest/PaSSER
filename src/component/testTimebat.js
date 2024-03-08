import React, { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import axios from 'axios';
import './testTimebat.css';
import { ProgressSpinner } from 'primereact/progressspinner';
import configuration from './configuration.json';

const TestTimebat = () => {
    const [selectedOllama, setSelectedOllama] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [dialogVisible, setDialogVisible] = useState(true);
    const [testName, setTestName] = useState('');
    const [QAJSON, setQAJSON] = useState([{}]);
    const [isTesting, setIsTesting] = useState(false);
    const [total, setTotal] = useState(0);
    const [completed, setCompleted] = useState(0);

    useEffect(() => {
        const ol = localStorage.getItem("selectedOllama") || 'localhost:11434';
        setSelectedOllama(ol);
        const mdl = localStorage.getItem("selectedLLMModel") || 'mistral';
        setSelectedModel(mdl);
    }, []);

    function handleFileChange(files) {
        if (files.length > 0) {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const contents = e.target.result;
                try {
                    const json = JSON.parse(contents);
                    setQAJSON(json);
                } catch (error) {
                    console.error('Error parsing JSON', error);
                }
            };
            reader.readAsText(file);
        }
    }
    
    const startTest = async () => {
        setIsTesting(true);
        setTotal(QAJSON.length);
        for (let i = 0; i < QAJSON.length; i++) {
            console.log("QAJSON[i]", QAJSON[i], i);
            const question = QAJSON[i].question;

            await axios.post(selectedOllama + '/api/generate', {"model": selectedModel, "prompt": question, "stream": false })
            .then(async res => {
                const metrics = {
                    results: String(res.data.eval_duration) + ',' + 
                            String(res.data.eval_count) + ',' + String(res.data.load_duration) + ',' +
                            String(res.data.prompt_eval_count) + ',' + String(res.data.prompt_eval_duration) + ',' +
                            String(res.data.total_duration),
                    userID: localStorage.getItem("wharf_user_name"), 
                    testID: testName,
                    description: ''
                }
                await axios.post(configuration.PythonTimes + '/metrics', metrics);
    
                setCompleted(i + 1);
            });
        }
        setIsTesting(false);
    };

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between'}}>
            {dialogVisible &&
            <div style={{ width: '90%', marginLeft: '20px'}}>
                <h3>Input Parameters for time tests</h3>
                <br></br>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '45%' }}>
                        <label>Test Name</label>
                        <InputText id="testName" style={{ width: '100%' }} value={testName} onChange={(e) => setTestName(e.target.value)} />   
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '45%' }}>
                        <label htmlFor="fileInput">Select JSON Query</label>
                        <input type="file" id="fileInput" style={{ width: '100%' }} onChange={(e) => handleFileChange(e.target.files)} />
                    </div>
                </div>                
                <br></br>
                <Button label="Test Times" style={{marginTop: '10px'}} onClick={async () => {startTest();}} className="p-ml-2" />    
                {isTesting && <ProgressBar                             
                            value={((completed / total) * 100).toFixed(2)} 
                            style={{ width: '90%', marginTop: '10px' }} />}
                {isTesting && <ProgressSpinner style={{ width: '50px', height: '50px', marginLeft: '10px', width: '2em', height: '2em'}} strokeWidth="8"/>}

            </div>}

        </div>

    );

}

export default TestTimebat