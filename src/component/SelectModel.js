import { useState, useEffect } from "react";
import axios from "axios";
import { Dropdown } from "primereact/dropdown";
import './SelectModel.css';
import { InputText } from "primereact/inputtext";
import configuration from './configuration.json';

const SelectModel = () => {
    const [availableModels, setAvailableModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState(null);
    const [ChromaDBPath, setChromaDBPath] = useState(null);
    const [availableCromas, setAvailableCromas] = useState(configuration.passer.Chroma.map(item => item.url))
    const [selectedOllama, setSelectedOllama] = useState(null);
    const [temperature, setTemperature] = useState(0.2);

    const availableOllamas = configuration.passer.Ollama.map(item => item.url)

    useEffect(() => {

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
            </div>
        </div>
    );
}

export default SelectModel;