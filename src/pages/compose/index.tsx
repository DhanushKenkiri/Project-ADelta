import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, Container, TextField, Typography, Card, IconButton, Chip, FormControlLabel, Switch } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ArrowBack, Send, AttachFile } from '@mui/icons-material';
import { useWallet } from '@solana/wallet-adapter-react';
import { stellarService } from '../../lib/stellarService';
import { mailShareService } from '../../lib/mailShareService';

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  padding: theme.spacing(3),
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
}));

const ComposePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { publicKey } = useWallet();
  
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [useStellar, setUseStellar] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [recipientValid, setRecipientValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Parse query parameters for reply or forward
    const params = new URLSearchParams(location.search);
    const replyToId = params.get('replyTo');
    const forwardId = params.get('forward');

    const loadEmailDetails = async () => {
      if (replyToId) {
        // Handle reply
        try {
          const emails = await stellarService.getEmails(publicKey?.toString() || '');
          const email = emails.find(e => e.id === replyToId);
          
          if (email) {
            setTo(email.from);
            setSubject(`Re: ${email.subject}`);
            setContent(`\n\n-------- Original Message --------\nFrom: ${email.from}\nDate: ${email.timestamp.toLocaleString()}\nSubject: ${email.subject}\n\n${email.content}`);
          }
        } catch (error) {
          console.error('Error loading reply email:', error);
        }
      } else if (forwardId) {
        // Handle forward
        try {
          const emails = await stellarService.getEmails(publicKey?.toString() || '');
          const email = emails.find(e => e.id === forwardId);
          
          if (email) {
            setSubject(`Fwd: ${email.subject}`);
            setContent(`\n\n-------- Forwarded Message --------\nFrom: ${email.from}\nDate: ${email.timestamp.toLocaleString()}\nSubject: ${email.subject}\n\n${email.content}`);
          }
        } catch (error) {
          console.error('Error loading forwarded email:', error);
        }
      }
    };

    if (publicKey) {
      loadEmailDetails();
    }
  }, [location.search, publicKey]);

  // Validate recipient when 'to' value changes
  useEffect(() => {
    const validateRecipient = async () => {
      if (!to) {
        setRecipientValid(false);
        setErrorMessage('');
        return;
      }

      try {
        // For a real implementation, you'd validate if the address is a valid Stellar address
        if (to.startsWith('G') && to.length === 56) {
          const exists = await stellarService.addressExists(to);
          setRecipientValid(exists);
          setErrorMessage(exists ? '' : 'Recipient account does not exist on Stellar network');
        } else if (to.includes('@')) {
          // Basic email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          setRecipientValid(emailRegex.test(to));
          setErrorMessage(emailRegex.test(to) ? '' : 'Invalid email format');
        } else {
          setRecipientValid(false);
          setErrorMessage('Invalid recipient format');
        }
      } catch (error) {
        console.error('Error validating recipient:', error);
        setRecipientValid(false);
        setErrorMessage('Error validating recipient');
      }
    };

    validateRecipient();
  }, [to]);

  const handleSend = async () => {
    if (!publicKey) {
      setErrorMessage('Please connect your wallet');
      return;
    }

    if (!to || !subject) {
      setErrorMessage('Recipient and subject are required');
      return;
    }

    try {
      setSendingEmail(true);

      if (useStellar) {
        // Send via Stellar
        // In a real implementation, you'd get the private key securely
        // For demo purposes, we'll just use a placeholder
        const demoPrivateKey = 'SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
        
        await stellarService.sendEmail(
          {
            from: publicKey.toString(),
            subject,
            content,
            isRead: false,
            isStarred: false,
            labels: ['sent'],
            stellarPublicKey: publicKey.toString()
          },
          publicKey.toString(),
          to,
          demoPrivateKey
        );
      } else {
        // Send via Web3 sharing
        await mailShareService.shareEmail(
          Math.random().toString(36).substring(7),
          publicKey.toString(),
          to,
          {
            id: Math.random().toString(36).substring(7),
            from: publicKey.toString(),
            subject,
            content,
            timestamp: new Date(),
            isRead: false,
            isStarred: false,
            labels: ['sent'],
            stellarSignature: '',
            stellarPublicKey: publicKey.toString()
          }
        );
      }

      // Navigate back to inbox
      navigate('/inbox');
    } catch (error) {
      console.error('Error sending email:', error);
      setErrorMessage('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/inbox')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ ml: 2 }}>
          Compose New Message
        </Typography>
      </Box>

      <StyledCard>
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            fullWidth
            required
            error={!!to && !recipientValid}
            helperText={errorMessage}
            placeholder="Stellar address or email"
          />

          <TextField
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Message"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            fullWidth
            multiline
            rows={15}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <IconButton disabled={sendingEmail}>
                <AttachFile />
              </IconButton>
              <FormControlLabel
                control={
                  <Switch
                    checked={useStellar}
                    onChange={(e) => setUseStellar(e.target.checked)}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">Use Stellar</Typography>
                    <Chip 
                      size="small" 
                      color={useStellar ? "primary" : "default"}
                      label={useStellar ? "Blockchain Secured" : "Web3 Sharing"}
                    />
                  </Box>
                }
              />
            </Box>

            <Button
              variant="contained"
              color="primary"
              endIcon={<Send />}
              onClick={handleSend}
              disabled={!publicKey || sendingEmail || !recipientValid}
            >
              {sendingEmail ? 'Sending...' : 'Send'}
            </Button>
          </Box>
        </Box>
      </StyledCard>
    </Container>
  );
};

export default ComposePage; 