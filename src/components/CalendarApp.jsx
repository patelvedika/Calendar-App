import{ useState } from 'react';
import { Link } from "react-router-dom";
import { useTodos } from './TodoContext.jsx';

const CalendarApp = () => {
    const { addTodo, toggleTodo, removeTodo, getTodosForDate, addEvent, removeEvent, getEventsForDate } = useTodos();
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthsOfYear =['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentDate = new Date();
    const[currMonth, setCurrMonth] = useState(currentDate.getMonth());
    const[currYear, setCurrYear] = useState (currentDate.getFullYear());
    const[selectedDate, setSelectedDate] = useState(currentDate);
    const[showEventPopup, setShowEventPopup] = useState(false);
    const[syllabusText, setSyllabusText] = useState('');
    const[processing, setProcessing] = useState(false);
    const[eventText, setEventText] = useState('');
    const[eventHours, setEventHours] = useState('');
    const[eventMinutes, setEventMinutes] = useState('');
    

    const daysInMonth = new Date(currYear, currMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currYear, currMonth, 1).getDay();
    const prevMonth  = () => {
        setCurrMonth((prevMonth) => (prevMonth === 0 ? 11 : prevMonth - 1));
        setCurrYear((prevYear) => (currMonth === 0 ? prevYear - 1 : prevYear));
    }
    const nextMonth  = () => {
        setCurrMonth((prevMonth) => (prevMonth === 11 ? 0 : prevMonth + 1));
        setCurrYear((prevYear) => (currMonth === 11 ? prevYear + 1 : prevYear));
    }
    const handleDayClick = (day) => {
        const clickedDate = new Date(currYear, currMonth, day);
        const today = new Date();
        if(clickedDate >= today || clickedDate <= today){
            setSelectedDate(clickedDate);
            setShowEventPopup(true);
        }
    }

    const handleAddEvent = () => {
        if (eventText.trim()) {
            const time = eventHours && eventMinutes ? `${eventHours}:${eventMinutes}` : 'TBD';
            addEvent(selectedDate, time, eventText);
            setEventText('');
            setEventHours('');
            setEventMinutes('');
            setShowEventPopup(false);
        }
    }

    const processManualOnly = async () => {
        if (!syllabusText.trim()) {
            alert('Please paste syllabus text first');
            return;
        }
        
        setProcessing(true);
        try {
            console.log('Processing with manual extraction only');
            console.log('Text length:', syllabusText.length);
            
            // Run manual extraction directly
            const lines = syllabusText.split('\n');
            let todos = [];
            
            for (const line of lines) {
              console.log('Checking line:', line.trim());
              
              if (line.includes('•') || line.toLowerCase().includes('due') || 
                  line.toLowerCase().includes('homework') || 
                  line.toLowerCase().includes('assignment') ||
                  line.toLowerCase().includes('project') ||
                  line.toLowerCase().includes('lab') ||
                  line.toLowerCase().includes('quiz') ||
                  line.toLowerCase().includes('exam') ||
                  line.toLowerCase().includes('tues') ||
                  line.toLowerCase().includes('wed') ||
                  line.toLowerCase().includes('thurs') ||
                  line.toLowerCase().includes('mon') ||
                  line.toLowerCase().includes('fri')) {
                
                console.log('Found potential assignment line:', line.trim());
                
                let cleanLine = line.replace(/^•\s*/, '').trim();
                let title = cleanLine;
                let date = null;
                
                // Pattern 1: "Description due Day. M/D"
                const duePattern = /(.*?)\s+due\s+(?:Mon|Tues?|Wed|Thurs?|Fri|Sat|Sun)\.\s*(\d{1,2})\/(\d{1,2})/i;
                const dueMatch = cleanLine.match(duePattern);
                if (dueMatch) {
                  title = dueMatch[1].trim();
                  const month = parseInt(dueMatch[2]);
                  const day = parseInt(dueMatch[3]);
                  date = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  console.log('Matched due pattern:', { title, date, match: dueMatch[0] });
                } else {
                  // Pattern 2: "Description Day. M/D" (without "due")
                  const noDuePattern = /(.*?)\s+(Mon|Tues?|Wed|Thurs?|Fri|Sat|Sun)\.\s*(\d{1,2})\/(\d{1,2})/i;
                  const noDueMatch = cleanLine.match(noDuePattern);
                  if (noDueMatch) {
                    title = noDueMatch[1].trim();
                    const month = parseInt(noDueMatch[3]);
                    const day = parseInt(noDueMatch[4]);
                    date = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    console.log('Matched no-due pattern:', { title, date, match: noDueMatch[0] });
                  } else {
                    // Pattern 3: Just look for any M/D date
                    const dateOnlyPattern = /(\d{1,2})\/(\d{1,2})/;
                    const dateMatch = cleanLine.match(dateOnlyPattern);
                    if (dateMatch) {
                      const month = parseInt(dateMatch[1]);
                      const day = parseInt(dateMatch[2]);
                      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                        const dateIndex = cleanLine.indexOf(dateMatch[0]);
                        title = cleanLine.substring(0, dateIndex).trim();
                        date = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        console.log('Matched date-only pattern:', { title, date, match: dateMatch[0] });
                      } else {
                        console.log('Invalid date found:', dateMatch[0], 'month:', month, 'day:', day);
                      }
                    } else {
                      console.log('No date pattern matched for line:', cleanLine);
                    }
                  }
                }
                
                title = title.replace(/\s+/g, ' ').trim();
                
                if (title && title.length > 0) {
                  todos.push({ title, date });
                  console.log('Added assignment:', { title, date });
                }
              }
            }
            
            // Add the todos
            todos.forEach(todo => {
              addTodo(todo.date ? new Date(todo.date) : new Date(), todo.title);
            });
            
            alert(`Manual processing completed! Added ${todos.length} assignments.`);
            setSyllabusText('');
            
        } catch (error) {
            alert('Manual processing failed: ' + error.message);
        }
        setProcessing(false);
    }
    return (
        <div className="Calendar-app">
           <div className="Calendar">
                <h1 className="heading"></h1>
                <div className="navigate">
                    <h2 className="month">{monthsOfYear[currMonth]}</h2>
                    <h2 className="year">{currYear}</h2>
                    <div className="buttons">
                        <i className="bx bx-chevron-left" onClick={prevMonth}></i>
                        <i className="bx bx-chevron-right" onClick={nextMonth}></i>
                    </div>
                </div>
                <div className="weekdays">
                    {daysOfWeek.map((day) =><span key={day}>{day}</span>)}
                </div>
                <div className="days">
                    {[...Array(firstDayOfMonth).keys()].map((_, index) =>(<span key={`empty-${index}`}/>
                ))}
                {[...Array(daysInMonth).keys()].map((day)=> {
                    const date = new Date(currYear, currMonth, day + 1);
                    const hasEvents = getEventsForDate(date).length > 0;
                    return (
                        <span 
                            key={day +1} 
                            className={`${day+1 === currentDate.getDate() && currMonth === currentDate.getMonth() && currYear === currentDate.getFullYear() ? 'currentDate' : ''} ${hasEvents ? 'has-events' : ''}`}
                            onClick={() => handleDayClick(day + 1)}
                        >
                            {day +1}
                        </span>
                    );
                })}
                </div>
            </div>
            <div className="Todo-Events">
                <div className="events">
                    <div className="syllabus-calendar-section">
                    <div className="syllabus-input">
                        <h1 className="syllabus-heading"> </h1>
                        <textarea 
                            placeholder="Or paste syllabus text here (recommended for best results)" 
                            value={syllabusText} 
                            onChange={(e) => setSyllabusText(e.target.value)} 
                            disabled={processing}
                        />
                        <button onClick={() => processManualOnly()} disabled={processing}>
                            Manual Only
                        </button>
                    </div>
                    <div className="calendarVeiw">
                        <Link to="/" className ="month-view-btn">Monthly</Link>
                        <Link to="/Weekly" className ="weekly-view-btn">Weekly</Link>
                        <Link to="/Daily"className ="daily-view-btn">Daily</Link>
                    </div>
                </div>
                {showEventPopup && (
                    <div className="events-popup">
                        <div className="time-input">
                            <div className="event-popup-time">Time</div>
                            <input type="number" name="hours" min={0} max={24} className="hours" value={eventHours} onChange={(e) => setEventHours(e.target.value)} />
                            <input type="number" name="minutes" min={0} max={59} className="minutes" value={eventMinutes} onChange={(e) => setEventMinutes(e.target.value)} />
                        </div>
                        <textarea placeholder="Enter Event Text" value={eventText} onChange={(e) => setEventText(e.target.value)}></textarea>
                        <button className="add-event-btn" onClick={handleAddEvent}>Add Event</button>
                        <button className="close-event-btn" onClick={() => setShowEventPopup(false)}>
                            <i className="bx bx-x"></i>
                        </button>
                    </div>
                )}
                {getEventsForDate(selectedDate).map(event => (
                    <div key={event.id} className="event">
                        <div className="event-date-wrapper">
                            <div className="event-date">{selectedDate.toDateString()}</div>
                            <div className="event-time">{event.time}</div>
                        </div>
                        <div className="event-text">{event.text}</div>
                        <div className="events-button">
                            <i className="bx bx-message-alt-x" onClick={() => removeEvent(selectedDate, event.id)}></i>
                        </div>
                    </div>
                ))}
                </div>
                 <div className="todo-list">
                    <h1 className="todo-heading">Todo List</h1>
                    <div className="todos">
                        <h3>Todos for {selectedDate ? selectedDate.toDateString() : 'Today'}</h3>
                        <input 
                            type="text" 
                            placeholder="Add todo" 
                            onKeyPress={(e) => { 
                                if(e.key === 'Enter' && e.target.value.trim()) { 
                                    addTodo(selectedDate || new Date(), e.target.value.trim()); 
                                    e.target.value = ''; 
                                } 
                            }} 
                        />
                        <ul>
                            {getTodosForDate(selectedDate || new Date()).map(todo => (
                                <li key={todo.id}>
                                    <input 
                                        type="checkbox" 
                                        checked={todo.completed} 
                                        onChange={() => toggleTodo(selectedDate || new Date(), todo.id)} 
                                    />
                                    <span style={{textDecoration: todo.completed ? 'line-through' : 'none'}}>
                                        {todo.text}
                                    </span>
                                    <button onClick={() => removeTodo(selectedDate || new Date(), todo.id)}>X</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default CalendarApp;