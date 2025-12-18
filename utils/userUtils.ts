export const getDisplayNameFromEmail = (email: string): string => {
  if (!email) return 'User';
  
  // Extract prefix before @
  const prefix = email.split('@')[0];
  
  // If contains . or _, take first segment
  const segment = prefix.split(/[._]/)[0];
  
  // Capitalize first letter
  if (segment.length > 0) {
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  }
  
  return 'User';
};