-- Create the database
CREATE DATABASE IF NOT EXISTS deepbeforedo;
USE deepbeforedo;

-- Create the main topics table tracking the 4 stages
CREATE TABLE IF NOT EXISTS topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discipline VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    
    -- Stage 1: Intent
    intent_why TEXT,
    intent_problem TEXT,
    
    -- Stage 2: Processing
    processing_explanation TEXT,
    
    -- Stage 3: Proof
    proof_confidence INT CHECK (proof_confidence BETWEEN 1 AND 5),
    
    -- Stage 4: Mastery
    mastery_level VARCHAR(50) DEFAULT 'Unknown',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
