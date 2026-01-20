import { Routes,Route } from "react-router-dom";
import CalendarApp from "./components/CalendarApp.jsx";
import './components/CalendarApp.css';
import WeeklyApp from "./components/Weekly.jsx";
import DailyApp from "./components/Daily.jsx";
import { TodoProvider } from "./components/TodoContext.jsx";

const App = () => {
  return (
    <TodoProvider>
      <div className="contrainer">
        <Routes>
          <Route path="/" element={<CalendarApp />}/>
          <Route path="/Weekly" element={<WeeklyApp />}/>
          <Route path="/Daily" element={<DailyApp />}/>
        </Routes>
      </div>
    </TodoProvider>
  );
}
export default App;