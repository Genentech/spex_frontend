## Setting Up on Apple Silicon

```bash
1. Install NVM (Node Version Manager):
   npm install -g nvm

2. Install the latest version of Node.js:
   nvm install node

3. Install project dependencies:
   npm install --force

4. Install Node.js version 16.9.0:
   nvm install 16.9.0

5. Switch to Node.js version 16.9.0:
   nvm use 16.9.0

6. Build the project with Node.js version 16.9.0:
   NODE_OPTIONS="--max-old-space-size=4096" yarn run build

7. Start the project with Node.js version 16.9.0:
   node scripts/start.js
```
Note: Depending on your system configuration, you may need to install Java and Python to complete the setup process. Ensure that both Java and Python are properly installed and configured if necessary.
