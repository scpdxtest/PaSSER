import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useEffect, useState } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import {Ollama} from 'langchain/llms/ollama';
import {OllamaEmbeddings} from 'langchain/embeddings/ollama';
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Chroma } from "langchain/vectorstores/chroma";

const DBFromWEB = () => {
    const [collectionName, setCollectionName] = useState('');
    const [webAddress, setWebAddress] = useState('');
    const [scrapInProgress, setScrapInProgress] = useState(false);
    const [selectedChromaDB, setSelectedChromaDB] = useState('');

    const embeddings_open = new OllamaEmbeddings({
        model: "mistral", // default value
        baseUrl: "http://127.0.0.1:11434", // default value  
      });

    const mdl = new Ollama({
        baseUrl: "http://127.0.0.1:11434",
        model: "mistral",
    });  

    useEffect(() => {
        const ch = localStorage.getItem("selectedChromaDB") || 'http://127.0.0.1:8000';
        setSelectedChromaDB(ch);
    }, []);

    const scrap = async () => {
        setScrapInProgress(true);
        // Document loader

        console.log("webAddress", webAddress);
        const loader = new CheerioWebBaseLoader(
            webAddress
        );

        const data = await loader.load();

        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1024,
            chunkOverlap: 0,
        });
              
        const splitDocs = await textSplitter.splitDocuments(data);

        console.log("data", data);
        console.log("splitDocs", splitDocs);

        try {
            const vectorStore = await Chroma.fromDocuments(
                data,
                embeddings_open,
                {collectionName: collectionName, collectionMetadata: {"hnsw:space": "cosine"}}
            );
        } catch (error) {
            alert("Error: " + error);
        }

        setScrapInProgress(false);
    };
    
    return (
        <div>
            <h3>Scrap DB from WEB</h3>
            <div>
                <span>Collection Name</span>
                <InputText style={{marginLeft: '10px', width: '800px'}} value={collectionName} onChange={(e) => setCollectionName(e.target.value)} />
            </div>
            <div style={{marginTop: '10px'}}>
                <span>WEB Address</span>
                <InputText style={{marginLeft: '10px', width: '800px'}} value={webAddress} onChange={(e) => setWebAddress(e.target.value)} />
            </div>
            <Button style={{marginTop: '10px'}} label="Scrap" onClick={scrap} disabled={!collectionName || !webAddress} />
            {scrapInProgress && <ProgressSpinner style={{marginTop: '10px'}} />}
        </div>
    );
};

export default DBFromWEB;
