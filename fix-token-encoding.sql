-- Update session tokens to be URL-encoded
UPDATE session 
SET token = encodeURIComponent(token)
WHERE token NOT LIKE '%25%';
