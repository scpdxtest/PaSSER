import { ChromaClient } from "chromadb";
import { useEffect, useState } from "react";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import {OllamaEmbeddings} from 'langchain/embeddings/ollama';
import { Chroma } from "langchain/vectorstores/chroma";
import { ConfirmDialog } from 'primereact/confirmdialog';

const ManageDB = () => {

    const embeddings_open = new OllamaEmbeddings({
        model: "mistral", 
        baseUrl: selectedOllama
      });

    const [collections, setCollections] = useState([]);
    const [dbInfo, setDbInfo] = useState('');
    const [selectedChromaDB, setSelectedChromaDB] = useState('');
    const [selectedOllama, setSelectedOllama] = useState(null);

    const listCollections = async (ch) => {
        const client = new ChromaClient({path: ch});

        let collection2 = await client.listCollections();

        const collectionsWithIdAndName = collection2.map((collection) => ({
            name: collection.name,
            id: collection.id,
        }));
        setCollections(collectionsWithIdAndName);
    };

    useEffect(() => {
        const ch = localStorage.getItem("selectedChromaDB") || 'http://127.0.0.1:8000';
        setSelectedChromaDB(ch);
        const ol = localStorage.getItem("selectedOllama") || 'http://127.0.0.1:11434';
        setSelectedOllama(ol);
        listCollections(ch);
    }, []);

    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [collectionToDelete, setCollectionToDelete] = useState(null);

    const deleteCollection = (collectionId) => {
        setCollectionToDelete(collectionId);
        setDeleteDialogVisible(true);
    };

    const confirmDeleteCollection = async () => {
        const client = new ChromaClient({path: selectedChromaDB});

        await client.deleteCollection({name: collectionToDelete});

        listCollections(selectedChromaDB);

        setDeleteDialogVisible(false);
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <Button label="Delete" className="p-button-danger" onClick={() => deleteCollection(rowData.name)} />
        );
    };

    const onRowDoubleClick = async (e) => {
        const collection = e.data;
        const client = new ChromaClient({path: selectedChromaDB});
        let collection2 = await client.getCollection({name: e.data.name});
        let docCount = await collection2.count();
        const list = await collection2.peek(10);
        const vectorStore1 = await Chroma.fromExistingCollection(
            embeddings_open,
            {
                collectionName: e.data.name,
                url: selectedChromaDB,
            });
        const retriever = vectorStore1.asRetriever();
    
        setDbInfo(`Collection name: ${collection.name} \nCollection ID: ${collection.id} \nCollection size: ${retriever.size} \nDoc count: ${docCount} \nList: ${JSON.stringify(list)} \nCollection: $${JSON.stringify(retriever)}`);
    };

    return (
        <div style={{ width: '90%', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
                <h3>Manage DB</h3>
                <DataTable style={{width: '90%'}} value={collections} onRowDoubleClick={onRowDoubleClick}
                size={"small"} showGridlines stripedRows>
                    <Column field="name" header="Name"></Column>
                    <Column field="id" header="ID"></Column>
                    <Column body={actionBodyTemplate}></Column>
                </DataTable>
            </div>
            {dbInfo && <div style={{ marginLeft: '20px', width: '40%' }}>
                <h3>DB Info</h3>
                <pre style={{whiteSpace: 'pre-wrap', wordWrap: 'break-word'}} >{dbInfo}</pre>
            </div>}
            <ConfirmDialog visible={deleteDialogVisible} onHide={() => setDeleteDialogVisible(false)} message="Are you sure you want to delete this collection?" header="Confirmation" icon="pi pi-exclamation-triangle" accept={confirmDeleteCollection} reject={() => setDeleteDialogVisible(false)} />
       </div>
    );}

export default ManageDB;