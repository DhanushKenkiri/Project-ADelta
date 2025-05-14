import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, Container, Grid, Typography, TextField, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction, Chip, Avatar, Badge, Menu, MenuItem, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { MoreVert, Star, StarBorder, Delete, Archive, MarkEmailUnread, MarkEmailRead, Reply, Forward, Label, FilterList, Search } from '@mui/icons-material';
import { useWallet } from '@solana/wallet-adapter-react';
import { StellarService } from '../../lib/stellarService';
import { MailShareService } from '../../lib/mailShareService';
import { formatDistanceToNow } from 'date-fns';

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  padding: theme.spacing(3),
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
}));

interface Email {
  id: string;
  from: string;
  subject: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  stellarSignature: string;
  stellarPublicKey: string;
}

const InboxPage: React.FC = () => {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (publicKey) {
      loadEmails();
    }
  }, [publicKey]);

  const loadEmails = async () => {
    try {
      setLoading(true);
      const stellarService = new StellarService();
      const mailShareService = new MailShareService();

      // Get emails from both Stellar and MailShare
      const stellarEmails = await stellarService.getEmails(publicKey.toString());
      const mailShareEmails = await mailShareService.getEmails(publicKey.toString());

      // Combine and sort emails
      const allEmails = [...stellarEmails, ...mailShareEmails].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setEmails(allEmails);
    } catch (error) {
      console.error('Error loading emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      markAsRead(email.id);
    }
  };

  const markAsRead = async (emailId: string) => {
    try {
      const updatedEmails = emails.map(email => 
        email.id === emailId ? { ...email, isRead: true } : email
      );
      setEmails(updatedEmails);
      
      // Update on blockchain
      const stellarService = new StellarService();
      await stellarService.markAsRead(emailId, publicKey.toString());
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  };

  const toggleStar = async (emailId: string) => {
    try {
      const updatedEmails = emails.map(email => 
        email.id === emailId ? { ...email, isStarred: !email.isStarred } : email
      );
      setEmails(updatedEmails);
      
      // Update on blockchain
      const stellarService = new StellarService();
      await stellarService.toggleStar(emailId, publicKey.toString());
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const deleteEmail = async (emailId: string) => {
    try {
      setEmails(emails.filter(email => email.id !== emailId));
      
      // Delete from blockchain
      const stellarService = new StellarService();
      await stellarService.deleteEmail(emailId, publicKey.toString());
    } catch (error) {
      console.error('Error deleting email:', error);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const filteredEmails = emails.filter(email => {
    const matchesSearch = 
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'unread' && !email.isRead) ||
      (filter === 'starred' && email.isStarred);

    return matchesSearch && matchesFilter;
  });

  return (
    <Container maxWidth="xl">
      <Grid container spacing={3}>
        {/* Sidebar */}
        <Grid item xs={12} md={3}>
          <StyledCard>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={() => navigate('/compose')}
              sx={{ mb: 2 }}
            >
              Compose
            </Button>
            
            <List>
              <ListItem button onClick={() => setFilter('all')}>
                <ListItemText primary="All Mail" />
                <Chip label={emails.length} size="small" />
              </ListItem>
              <ListItem button onClick={() => setFilter('unread')}>
                <ListItemText primary="Unread" />
                <Chip 
                  label={emails.filter(e => !e.isRead).length} 
                  size="small" 
                  color="primary"
                />
              </ListItem>
              <ListItem button onClick={() => setFilter('starred')}>
                <ListItemText primary="Starred" />
                <Chip 
                  label={emails.filter(e => e.isStarred).length} 
                  size="small" 
                  color="warning"
                />
              </ListItem>
            </List>
          </StyledCard>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={9}>
          <StyledCard>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1 }} />,
                }}
              />
              <IconButton onClick={handleMenuClick}>
                <FilterList />
              </IconButton>
            </Box>

            <List>
              {filteredEmails.map((email) => (
                <React.Fragment key={email.id}>
                  <ListItem
                    button
                    onClick={() => handleEmailClick(email)}
                    sx={{
                      bgcolor: email.isRead ? 'transparent' : 'rgba(25, 118, 210, 0.08)',
                    }}
                  >
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(email.id);
                      }}
                    >
                      {email.isStarred ? <Star color="warning" /> : <StarBorder />}
                    </IconButton>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: email.isRead ? 'normal' : 'bold' }}>
                            {email.from}
                          </Typography>
                          {email.stellarSignature && (
                            <Chip
                              label="Verified"
                              size="small"
                              color="success"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: email.isRead ? 'normal' : 'bold' }}>
                            {email.subject}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(new Date(email.timestamp), { addSuffix: true })}
                          </Typography>
                        </Box>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmail(email);
                          handleMenuClick(e);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Email Detail View */}
      {selectedEmail && (
        <StyledCard sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5">{selectedEmail.subject}</Typography>
            <Box>
              <IconButton onClick={() => toggleStar(selectedEmail.id)}>
                {selectedEmail.isStarred ? <Star color="warning" /> : <StarBorder />}
              </IconButton>
              <IconButton onClick={() => deleteEmail(selectedEmail.id)}>
                <Delete />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar>{selectedEmail.from[0]}</Avatar>
            <Box sx={{ ml: 2 }}>
              <Typography variant="subtitle1">{selectedEmail.from}</Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(new Date(selectedEmail.timestamp), { addSuffix: true })}
              </Typography>
            </Box>
            {selectedEmail.stellarSignature && (
              <Chip
                label="Verified by Stellar"
                color="success"
                sx={{ ml: 2 }}
              />
            )}
          </Box>

          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {selectedEmail.content}
          </Typography>

          <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<Reply />}
              onClick={() => navigate(`/compose?replyTo=${selectedEmail.id}`)}
            >
              Reply
            </Button>
            <Button
              variant="outlined"
              startIcon={<Forward />}
              onClick={() => navigate(`/compose?forward=${selectedEmail.id}`)}
            >
              Forward
            </Button>
          </Box>
        </StyledCard>
      )}

      {/* Filter Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { setFilter('all'); handleMenuClose(); }}>
          All Mail
        </MenuItem>
        <MenuItem onClick={() => { setFilter('unread'); handleMenuClose(); }}>
          Unread
        </MenuItem>
        <MenuItem onClick={() => { setFilter('starred'); handleMenuClose(); }}>
          Starred
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default InboxPage; 