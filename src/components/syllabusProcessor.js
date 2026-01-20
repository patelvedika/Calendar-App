import OpenAI from 'openai';
import { OPENAI_API_KEY } from '../config.js';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, call from backend
});

export const extractTextFromPDF = async (file) => {
  const { getDocument } = await import('pdfjs-dist');
  const { GlobalWorkerOptions } = await import('pdfjs-dist');
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async (e) => {
      try {
        const typedarray = new Uint8Array(e.target.result);
        const pdf = await getDocument(typedarray).promise;
        let text = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          
          // Extract text with better formatting
          const pageText = content.items
            .map(item => item.str)
            .join(' ')
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
            
          text += pageText + '\n';
        }
        
        // Clean up the extracted text
        text = text
          .replace(/-\s+/g, '') // Remove hyphenation
          .replace(/\n\s*\n/g, '\n') // Remove empty lines
          .trim();
        
        console.log('Cleaned PDF text length:', text.length);
        console.log('First 300 chars of cleaned text:', text.substring(0, 300));
        
        resolve(text);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const processSyllabusWithAI = async (text) => {
  const prompt = `
Find all assignments, homework, projects, labs, and tasks in this syllabus text.

Look specifically for:
- Lines containing "due" or "deadline"
- Items under "assignments" or "homework" sections
- Any academic tasks with dates

For each assignment found, extract:
- The assignment name/title
- The due date (dates may be in format like "1/22" meaning January 22, 2026)

Return ONLY a JSON array: [{"title": "Assignment Name", "date": "2026-01-22"}]

Text: ${text}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    });

    const content = response.choices[0].message.content.trim();
    console.log('Raw AI response:', content);
    
    // Try multiple parsing strategies
    let todos = [];
    
    // Strategy 1: Direct JSON array
    try {
      if (content.startsWith('[') && content.endsWith(']')) {
        todos = JSON.parse(content);
        console.log('Parsed as direct JSON array');
      }
    } catch (e) {
      console.log('Direct JSON parsing failed');
    }
    
    // Strategy 2: Extract from markdown
    if (todos.length === 0) {
      const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/);
      if (jsonMatch) {
        try {
          todos = JSON.parse(jsonMatch[1]);
          console.log('Parsed from markdown');
        } catch (e) {
          console.log('Markdown JSON parsing failed');
        }
      }
    }
    
    // Strategy 3: Manual extraction from ORIGINAL TEXT (always run as backup)
    console.log('Running manual extraction from original text (backup)');
    const lines = text.split('\n');
    console.log('Processing', lines.length, 'lines of text');
    
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
    return { todos: normalizedTodos };
    
  } catch (e) {
    console.error('Error calling OpenAI API:', e);
    return { todos: [] };
  }
};