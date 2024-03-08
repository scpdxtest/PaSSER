import logo from './logo.svg';
import './App.css';
import "primereact/resources/themes/lara-light-teal/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { Routes, Route } from 'react-router-dom';
import Navigation from './component/Nav';
import About from './component/About';
import ErrorBoundary from './component/ErrorBoundry';
import Gpt from './component/gpt';
import SelectModel from './component/SelectModel';
import DBFromText from './component/dbFromText';
import DBFromWEB from './component/dbFromWEB';
import ChatFromDB from './component/chatFromDB';
import DBFromPDF from './component/dbFromPDF';
import AddModel from './component/addModel';
import TestWharf from './component/TestWharf';
import TestRAGbat from './component/testRAGbat';
import ShowTestResults from './component/showTestResults';
import QATest from './component/qaTest';
import RagQATest from './component/ragQUTest';
import TestTimebat from './component/testTimebat';
import ShowTimeTestResults from './component/showTimeTestResults';
import ManageDB from './component/manageDB';

function App() {
  return (
    <div className="App">
      <ErrorBoundary>   
       <Navigation />
            <Routes>
              <Route path='/about' element={<About/>}/>
              <Route path="/gpt" element={<Gpt/>} />
              <Route path="/selectmodel" element={<SelectModel/>} />
              <Route path="/chatfromdb" element={<ChatFromDB/>} />
              <Route path="/dbfromtext" element={<DBFromText/>} />
              <Route path="/dbfromweb" element={<DBFromWEB/>} />
              <Route path="/dbfrompdf" element={<DBFromPDF/>} />
              <Route path="/addmodel" element={<AddModel/>} />
              <Route path="/testwharf" element={<TestWharf/>} />
              <Route path="/testRAGbat" element={<TestRAGbat/>} />
              <Route path="/showTestResults" element={<ShowTestResults/>} />
              <Route path="/qatest" element={<QATest/>} />
              <Route path="/ragqatest" element={<RagQATest/>} />
              <Route path="/testtimebat" element={<TestTimebat/>} />
              <Route path="/showTimeTestResults" element={<ShowTimeTestResults/>} />
              <Route path="/managedb" element={<ManageDB/>} />
            </Routes>
        </ErrorBoundary>   
    </div>
  );
}

export default App;
