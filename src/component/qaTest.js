import { Button } from "primereact/button";
import { useEffect, useState } from "react";
import {Ollama} from 'langchain/llms/ollama';
import {OllamaEmbeddings} from 'langchain/embeddings/ollama';
import axios from "axios";
import { saveAs } from 'file-saver';
import { InputTextarea } from "primereact/inputtextarea";
import { ProgressBar } from "primereact/progressbar";

const QATest = () => {
    const [prompt, setPrompt] = useState('Imagine you are a virtual assistant trained in the detailed regulations of organic agriculture. Your task involves creating precise question for a specific regulatory statement provided to you below. The statement comes directly from the regulations, and your challenge is to reverse-engineer the question that this statement answers. Your formulated question should be concise, clear, and directly related to the content of the statement. Aim to craft your question without implying the statement itself as the answer, and, where relevant, gear your question towards eliciting specific events, facts, or regulations.');
    // const prompt = 'You are an expert in agriculture who observing the reglament. You formulate questions based on quotes from the reglament. Below is one such quote. Formulate a question that the quote would be the perfect answer to. The question should be short and detailed like in an interview. The question is short. Remember, make the question as short as possible. Do not give away the answer in your question. Also: If possible, ask for events or facts.'

    // const prompt = 'Imagine you are a virtual assistant trained in the detailed regulations of organic agriculture. Your task involves creating precise question for a specific regulatory statement provided to you below. The statement comes directly from the regulations, and your challenge is to reverse-engineer the question that this statement answers. Your formulated question should be concise, clear, and directly related to the content of the statement. Aim to craft your question without implying the statement itself as the answer, and, where relevant, gear your question towards eliciting specific events, facts, or regulations.'

    // const prompt = 'Imagine you are a virtual assistant with expertise in EU organic production standards, specifically trained on REGULATION (EU) 2018/848 regarding organic production and labelling of organic products. Your current task involves generating precise questions from specific statements extracted from this regulation. Each statement will be presented to you one at a time, and your challenge is to formulate the exact question to which this statement responds. Your question should be concise, insightful, and directly related to the nuances of the regulation. Aim to construct your question in such a manner that it does not suggest the statement itself as the answer, and where appropriate, direct your question to elicit detailed information on specific regulations, events, or factual content delineated in the document.'

    // const prompt = 'Generate precise questions from specific statements. Each statement will be presented to you one at a time, and your challenge is to formulate the exact question to which this statement responds. Your question should be directly related to the statement. Aim to construct your question in such a manner that it does not suggest the statement itself as the answer, and where appropriate, direct your question to elicit detailed information on factual content.'

    const embeddings_open = new OllamaEmbeddings({
        model: 'mistral', 
        baseUrl: selectedOllama
      });
      const mdl = new Ollama({
        baseUrl: selectedOllama,
        model: 'mistral'
    });  

    const [fileContent, setFileContent] = useState('');
    const [selectedChromaDB, setSelectedChromaDB] = useState('');
    const [selectedOllama, setSelectedOllama] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [isTesting, setIsTesting] = useState(false);
    const [total, setTotal] = useState(0);
    const [completed, setCompleted] = useState(0);

    const myLoop = async () => {
        var myDict = [];
        setIsTesting(true);
        const paragraphs = fileContent.split('\n');
        setTotal(paragraphs.length);
        for (let i = 0; i < paragraphs.length; i++) {
            const paragraph = paragraphs[i];
            console.log(paragraph, i);
                const res = await axios.post(selectedOllama + '/api/generate', {"model": selectedModel, "prompt": prompt + paragraph, "stream": false })
                const ans = JSON.parse(res.request.response).response.replace(/[^a-zA-Z0-9 ]/g, ''); //.response.replace(/\\"/g, '');
                const tmp_j = {"question": ans, "answer": paragraph};
                myDict.push(tmp_j);
                setCompleted(i + 1);
            };
            const blob = new Blob([JSON.stringify(myDict, null, 2)], {type: "text/plain;charset=utf-8"});
            saveAs(blob, "myDict.txt");
            setIsTesting(false);
            setCompleted(0);
            setTotal(0);
    }

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
            setFileContent(event.target.result);
        };

        reader.readAsText(file);
    };

    useEffect(() => {
        console.log("QATest");
        const ch = localStorage.getItem("selectedChromaDB") || 'http://127.0.0.1:8000';
        setSelectedChromaDB(ch);
        const ol = localStorage.getItem("selectedOllama") || 'http://127.0.0.1:11434';
        setSelectedOllama(ol);
        const mdl = localStorage.getItem("selectedLLMModel") || 'mistral';
        setSelectedModel(mdl);
    }, []);

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <div>Your prompt:</div>
                <InputTextarea rows={5} style={{width: '90%'}} value={prompt} autoResize onChange={(e) => setPrompt(e.target.value)}/>
            </div>
            <div>
                <input type="file" onChange={handleFileSelect} />
                <Button label="Process Text" style={{marginTop: '10px'}} onClick={() => myLoop(fileContent)} />
                {isTesting && <ProgressBar                             
                            value={((completed / total) * 100).toFixed(2)} 
                            style={{ marginLeft: '5%', justifyItems: 'center', width: '90%', marginTop: '10px' }} />}
            </div>
            <pre>{fileContent}</pre>
        </div>
    );
}

export default QATest;