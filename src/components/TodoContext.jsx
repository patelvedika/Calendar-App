import React, { createContext, useContext, useState, useEffect } from 'react';

const TodoContext = createContext();

export const useTodos = () => useContext(TodoContext);

export const TodoProvider = ({ children }) => {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : {};
  });

  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('events');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('events', JSON.stringify(events));
  }, [events]);

  const addTodo = (date, text) => {
    const dateStr = date.toDateString();
    setTodos(prev => ({
      ...prev,
      [dateStr]: [...(prev[dateStr] || []), { id: Date.now(), text, completed: false }]
    }));
  };

  const toggleTodo = (date, id) => {
    const dateStr = date.toDateString();
    setTodos(prev => ({
      ...prev,
      [dateStr]: prev[dateStr].map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    }));
  };

  const removeTodo = (date, id) => {
    console.log('removeTodo called with:', { date: date instanceof Date ? date.toDateString() : date, id, type: typeof date });
    const dateStr = date.toDateString();
    setTodos(prev => {
      const updatedTodos = { ...prev };
      if (updatedTodos[dateStr]) {
        const originalLength = updatedTodos[dateStr].length;
        updatedTodos[dateStr] = updatedTodos[dateStr].filter(todo => todo.id !== id);
        console.log(`Removed todo from ${dateStr}: ${originalLength} -> ${updatedTodos[dateStr].length}`);
        if (updatedTodos[dateStr].length === 0) {
          delete updatedTodos[dateStr];
        }
      } else {
        console.log(`No todos found for date ${dateStr}`);
      }
      localStorage.setItem('todos', JSON.stringify(updatedTodos));
      return updatedTodos;
    });
  };

  const getTodosForDate = (date) => {
    const dateStr = date.toDateString();
    return todos[dateStr] || [];
  };

  const addEvent = (date, time, text) => {
    const dateStr = date.toDateString();
    setEvents(prev => ({
      ...prev,
      [dateStr]: [...(prev[dateStr] || []), { id: Date.now(), time, text }]
    }));
  };

  const removeEvent = (date, id) => {
    const dateStr = date.toDateString();
    setEvents(prev => ({
      ...prev,
      [dateStr]: prev[dateStr].filter(event => event.id !== id)
    }));
  };

  const getEventsForDate = (date) => {
    const dateStr = date.toDateString();
    return events[dateStr] || [];
  };

  return (
    <TodoContext.Provider value={{ addTodo, toggleTodo, removeTodo, getTodosForDate, addEvent, removeEvent, getEventsForDate }}>
      {children}
    </TodoContext.Provider>
  );
};