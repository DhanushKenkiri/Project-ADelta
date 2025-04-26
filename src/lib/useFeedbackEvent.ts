import { useState, useEffect } from 'react';
import { useFeedback } from '../components/FeedbackProvider';

interface UseFeedbackEventProps {
  userInput?: string;
  aiOutput?: string;
  autoLog?: boolean;
}

interface UseFeedbackEventResult {
  eventId: string;
  logInput: (input: string) => string;
  logOutput: (output: string) => string;
}

/**
 * A custom hook to easily integrate feedback into components that interact with AI
 * 
 * @param props Configuration options
 * @returns Event ID and logging functions
 */
export const useFeedbackEvent = (props?: UseFeedbackEventProps): UseFeedbackEventResult => {
  const { logUserInput, logAIOutput } = useFeedback();
  const [eventId, setEventId] = useState<string>('');
  const [inputLogged, setInputLogged] = useState<boolean>(false);
  
  // Auto-log the input and output if provided and autoLog is true
  useEffect(() => {
    if (props?.autoLog && props?.userInput && !inputLogged) {
      const id = logUserInput(props.userInput);
      setEventId(id);
      setInputLogged(true);
    }
  }, [props?.userInput, props?.autoLog, inputLogged]);
  
  useEffect(() => {
    if (props?.autoLog && props?.aiOutput && inputLogged && eventId) {
      logAIOutput(props.aiOutput, eventId);
    }
  }, [props?.aiOutput, props?.autoLog, inputLogged, eventId]);
  
  // Function to manually log user input
  const logInput = (input: string): string => {
    const id = logUserInput(input);
    setEventId(id);
    setInputLogged(true);
    return id;
  };
  
  // Function to manually log AI output
  const logOutput = (output: string): string => {
    return logAIOutput(output, eventId);
  };
  
  return {
    eventId,
    logInput,
    logOutput
  };
}; 