#!/bin/bash

# Script to push fresh repository to GitHub
echo "🚀 Pushing Stars Vacation Management V2 to GitHub..."

# Repository name
REPO_NAME="Stars_Vacation_Management_V2"

echo ""
echo "📋 Before running this script, make sure you have:"
echo "1. Created the GitHub repository: $REPO_NAME"
echo "2. Made it private"
echo "3. Did NOT initialize with README, .gitignore, or license"
echo ""

# Add the remote origin
echo "🔗 Adding remote origin..."
git remote add origin "https://github.com/PierreCStars/$REPO_NAME.git"

# Set the main branch
echo "🌿 Setting main branch..."
git branch -M main

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Repository pushed successfully!"
echo "🔗 Your repository is now available at:"
echo "   https://github.com/PierreCStars/$REPO_NAME"
echo ""
echo "🚀 Next steps:"
echo "1. Go to Vercel and create a new project"
echo "2. Connect your GitHub repository: $REPO_NAME"
echo "3. Configure environment variables"
echo "4. Deploy!"