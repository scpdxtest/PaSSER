import { useState, useEffect } from "react";
import axios from "axios";
import { Dropdown } from "primereact/dropdown";
import './SelectModel.css';
import { InputText } from "primereact/inputtext";
import configuration from './configuration.json';
import { SelectButton } from 'primereact/selectbutton';
import { set } from "cohere-ai/core/schemas";

const SelectModel = () => {
    const [availableModels, setAvailableModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState(null);
    const [ChromaDBPath, setChromaDBPath] = useState(null);
    const [availableCromas, setAvailableCromas] = useState(configuration.passer.Chroma.map(item => item.url))
    const [selectedOllama, setSelectedOllama] = useState(null);
    const [temperature, setTemperature] = useState(0.2);
    const retOptions = ['Normal', 'Score'];
    const [retriever, setRetriever] = useState();

    const availableOllamas = configuration.passer.Ollama.map(item => item.url)
    const [errorMessage1, setErrorMessage1] = useState('');
    const [errorMessage2, setErrorMessage2] = useState('');
    const [errorMessage3, setErrorMessage3] = useState('');
    const [symScore, setSymScore] = useState(0);
    const [k, setK] = useState(0);
    const [kInc, setKInc] = useState(0);

    useEffect(() => {
        setSymScore(Number(localStorage.getItem("symScore")) || 0.9);
        setK(Number(localStorage.getItem("k")) || 100);
        setKInc(Number(localStorage.getItem("kInc")) || 2);
        setRetriever(localStorage.getItem("retriever"));        
        console.log('json', configuration.passer.Ollama.map(item => item.url));
        const temp = localStorage.getItem("chatTempreture") || '0.2';
        setTemperature(parseFloat(temp));
        const ol = localStorage.getItem("selectedOllama") || 'http://127.0.0.1:11434';
        axios.get(ol + '/api/tags')
        .then((res) => {
            setAvailableModels(res.data);
        })
        .catch((err) => {
            console.log(err);
            alert("Ollama is not available");   
        });
    }, []);

    return (
        <div>
            <h1>Configurations</h1>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div>
                    <h3>Select Ollama Path</h3>
                    <Dropdown
                        value={selectedOllama} 
                        options={availableOllamas} 
                        onChange={(e) => {setSelectedOllama(e.value); localStorage.setItem("selectedOllama", e.value); window.location.reload(false);}} 
                        placeholder="Select an Ollama" 
                    />
                </div>
                <div style={{ marginLeft: '50px' }}>
                    <h3>Select Model</h3>
                    <Dropdown
                        value={selectedModel} 
                        options={availableModels.models} 
                        onChange={(e) => {setSelectedModel(e.value); localStorage.setItem("selectedLLMModel", e.value.name); window.location.reload(false);}} 
                        placeholder="Select a Model" 
                        optionLabel="name"
                    />
                </div>
                <div style={{ marginLeft: '50px' }}>
                    <h3>Select ChromaDB</h3>
                    <Dropdown
                        value={ChromaDBPath} 
                        options={availableCromas} 
                        onChange={(e) => {setChromaDBPath(e.value); localStorage.setItem("selectedChromaDB", e.value); window.location.reload(false);}} 
                        placeholder="Select a Model" 
                    />
                </div>
                <div style={{ marginLeft: '50px' }}>
                    <h3>Chat Tempreture</h3>
                    <InputText style={{width: '100px'}}
                        value={temperature} 
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                localStorage.setItem("chatTempreture", parseFloat(e.target.value) || '0.2');
                                window.location.reload(false);
                            }
                        }}                    
                        onChange={(e) => {setTemperature(e.target.value)}} 
                        placeholder="Chat Tempreture" 
                    />
                </div>
                <div style={{ marginLeft: '50px' }}>
                    <h3>Retriever</h3>
                    <div className="card flex justify-content-center">
                        <SelectButton value={retriever} onChange={(e) => 
                            {
                                setRetriever(e.value); 
                                localStorage.setItem("retriever", e.value);
                                console.log('retriever', localStorage.getItem("retriever"));
                            }} options={retOptions} />
                    </div>
                    {retriever === 'Score' ? (
                        <div style={{ width: '100%', border: '1px solid black', marginTop: '10px' }}>
                            <div className="p-field p-grid">
                                <label htmlFor="input1" className="p-col-fixed" style={{width:'100px'}}>Symilarity score</label>
                                <div className="p-col">
                                    <InputText id="input1" type="number" min="0" max="1" step="0.0001" placeholder="Symilarity score" value={symScore}
                                        onChange={(e) => {
                                            const value = parseFloat(e.target.value);
                                            setSymScore(value);
                                            localStorage.setItem("symScore", value.toString());
                                        }}
                                        onBlur={(e) => {
                                            const value = parseFloat(e.target.value);
                                            if (value < 0 || value > 1 || (value * 10000) % 1 !== 0) {
                                                setErrorMessage1('Similarity score must be between 0 and 1 and have a maximum of 4 decimal places');
                                            } else {
                                                setErrorMessage1('');
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="p-field p-grid">
                                <label htmlFor="input2" className="p-col-fixed" style={{width:'100px'}}>k</label>
                                <div className="p-col">
                                <InputText id="input2" type="number" step="1" placeholder="k" value={k}
                                        onChange={(e) => {
                                            const value = parseFloat(e.target.value);
                                            setK(value);
                                            localStorage.setItem("k", value.toString());
                                        }}
                                        onBlur={(e) => {
                                            const value = parseFloat(e.target.value);
                                            if (value <= 0 || value % 1 !== 0) {
                                                setErrorMessage2('k must be greater than 0 and without decimals');
                                            } else {
                                                setErrorMessage2('');
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="p-field p-grid">
                                <label htmlFor="input3" className="p-col-fixed" style={{width:'100px'}}>k incremental</label>
                                <div className="p-col">
                                <InputText id="input2" type="number" step="1" placeholder="k incremental" value={kInc}
                                        onChange={(e) => {
                                            const value = parseFloat(e.target.value);
                                            setKInc(value);
                                            localStorage.setItem("kInc", value.toString());
                                        }}
                                        onBlur={(e) => {
                                            const value = parseFloat(e.target.value);
                                            if (value <= 0 || value > k || value % 1 !== 0) {
                                                setErrorMessage3('k incremental must be greater than 0, less than k and without decimals');
                                            } else {
                                                setErrorMessage3('');
                                            }
                                        }}
                                    />
                                </div>
                            </div>                        
                            {errorMessage1 && <div style={{ color: 'red' }}>{errorMessage1}</div>}
                            {errorMessage2 && <div style={{ color: 'red' }}>{errorMessage2}</div>}
                            {errorMessage3 && <div style={{ color: 'red' }}>{errorMessage3}</div>}
                        </div>
                    ) : null}                
                </div>                
            </div>
        </div>
    );
}

export default SelectModel;