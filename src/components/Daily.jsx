import { useState } from 'react';
import { Link } from "react-router-dom";
import { useTodos } from './TodoContext.jsx';

const DailyApp = () => {
    const { addTodo, toggleTodo, removeTodo, getTodosForDate, getEventsForDate, removeEvent } = useTodos();
    const monthsOfYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentDate = new Date();
    const [currDate, setCurrDate] = useState(currentDate);
    const [syllabusText, setSyllabusText] = useState('');
    const [processing, setProcessing] = useState(false);

    const currMonth = currDate.getMonth();
    const currYear = currDate.getFullYear();

    const prevDay = () => {
        setCurrDate(new Date(currDate.getTime() - 24 * 60 * 60 * 1000));
    };

    const nextDay = () => {
        setCurrDate(new Date(currDate.getTime() + 24 * 60 * 60 * 1000));
    };

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
                
                // Look for bullet points with assignments
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
                    
                    // Clean up the line - remove bullet and extra spaces
                    let cleanLine = line.replace(/^•\s*/, '').trim();
                    
                    // Look for date patterns like "Tues. 1/20", "Thurs. 1/22", etc.
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
                                    // Extract title as text before the date
                                    const dateIndex = cleanLine.indexOf(dateMatch[0]);
                                    title = cleanLine.substring(0, dateIndex).trim();
                                    date = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    console.log('Matched date-only pattern:', { title, date, match: dateMatch[0] });
                                }
                            }
                        }
                    }
                    
                    // Clean up title
                    title = title.replace(/\s+/g, ' ').trim();
                    
                    if (title && title.length > 0) {
                        todos.push({ title, date });
                        console.log('Added assignment:', { title, date });
                    }
                }
            }
            console.log('Manual extraction found:', todos.length, 'items');
            
            // Normalize the format
            const normalizedTodos = todos.map(item => ({
                title: item.title || item.name || item.description || 'Untitled',
                date: item.date || null
            }));
            
            console.log('Final todos:', normalizedTodos);
            
            let addedCount = 0;
            normalizedTodos.forEach(todo => {
                let date;
                if (todo.date) {
                    const [year, month, day] = todo.date.split('-').map(Number);
                    date = new Date(year, month - 1, day);
                } else {
                    date = new Date();
                }
                addTodo(date, todo.title);
                addedCount++;
            });
            alert(`Manual processing completed! Added ${addedCount} assignments.`);
        } catch (error) {
            console.error('Error in manual processing:', error);
            alert('Error in manual processing: ' + error.message);
        }
        setProcessing(false);
    };

    return (
        <div className="Daily-App">
            <div className="topbar">
                <div className="syllabus-calendar-section-two">
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
                        <Link to="/Weekly" className = "weekly-view-btn">Weekly</Link>
                        <Link to="/Daily" className = "daily-view-btn">Daily</Link>
                    </div>
                </div>
            </div>
            <div className="daily-calendar">
                <div className="navigate-daily">
                    <h2 className="month">{monthsOfYear[currMonth]}</h2>
                    <h2 className="year">{currYear}</h2>
                    <div className="buttons">
                        <i className="bx bx-chevron-left" onClick={prevDay}></i>
                        <i className="bx bx-chevron-right" onClick={nextDay}></i>
                    </div>
                </div>
                <div className="daily-date">
                    <span>{currDate.getDate()}</span>
                </div>
                <div className="daily-events">
                    <h3>Events for {currDate.toDateString()}</h3>
                    {getEventsForDate(currDate).map(event => (
                        <div key={event.id} className="event">
                            <div className="event-time">{event.time}</div>
                            <div className="event-text">{event.text}</div>
                            <button onClick={() => removeEvent(currDate, event.id)}>X</button>
                        </div>
                    ))}
                    <h3>Todos for {currDate.toDateString()}</h3>
                    <input 
                        type="text" 
                        placeholder="Add todo" 
                        onKeyPress={(e) => { 
                            if(e.key === 'Enter' && e.target.value.trim()) { 
                                addTodo(currDate, e.target.value.trim()); 
                                e.target.value = ''; 
                            } 
                        }} 
                    />
                    <ul>
                        {getTodosForDate(currDate).map(todo => (
                            <li key={todo.id}>
                                <input 
                                    type="checkbox" 
                                    checked={todo.completed} 
                                    onChange={() => toggleTodo(currDate, todo.id)} 
                                />
                                <span style={{textDecoration: todo.completed ? 'line-through' : 'none'}}>
                                    {todo.text}
                                </span>
                                <button onClick={() => removeTodo(currDate, todo.id)}>X</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default DailyApp;