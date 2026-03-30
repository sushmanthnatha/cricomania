const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Create players folder if it doesn't exist
const playersDir = path.join(__dirname, 'public', 'players');
if (!fs.existsSync(playersDir)) {
  fs.mkdirSync(playersDir, { recursive: true });
  console.log(`✅ Created directory: ${playersDir}`);
}

// Player images from Wikimedia Commons (actual direct links that work)
const playerImages = {
  "Rohit Sharma": "https://upload.wikimedia.org/wikipedia/commons/e/eb/Rohit_Sharma_2023.jpg",
  "David Warner": "https://upload.wikimedia.org/wikipedia/commons/0/02/David_Warner_%28cricketer%29_in_2018.jpg",
  "Babar Azam": "https://upload.wikimedia.org/wikipedia/commons/f/f9/Babar_Azam.jpg",
  "Faf du Plessis": "https://upload.wikimedia.org/wikipedia/commons/0/0c/Faf_du_Plessis_2023.jpg",
  "KL Rahul": "https://upload.wikimedia.org/wikipedia/commons/d/da/KL_Rahul.jpg",
  "Kane Williamson": "https://upload.wikimedia.org/wikipedia/commons/3/34/Kane_Williamson_2019.jpg",
  "Travis Head": "https://upload.wikimedia.org/wikipedia/commons/1/1f/Travis_Head_2022.jpg",
  "Jasprit Bumrah": "https://upload.wikimedia.org/wikipedia/commons/0/0e/Jasprit_Bumrah.jpg",
  "Pat Cummins": "https://upload.wikimedia.org/wikipedia/commons/d/d4/Pat_Cummins_2019.jpg",
  "Rashid Khan": "https://upload.wikimedia.org/wikipedia/commons/9/99/Rashid_Khan_%28cricketer%29.jpg",
  "Mitchell Starc": "https://upload.wikimedia.org/wikipedia/commons/1/15/Mitchell_Starc_2019.jpg",
  "Kagiso Rabada": "https://upload.wikimedia.org/wikipedia/commons/f/f0/Kagiso_Rabada_2019.jpg",
  "Trent Boult": "https://upload.wikimedia.org/wikipedia/commons/6/6e/Trent_Boult_2019.jpg",
  "Mohammed Shami": "https://upload.wikimedia.org/wikipedia/commons/0/0e/Mohammed_Shami.jpg",
  "Shaheen Afridi": "https://upload.wikimedia.org/wikipedia/commons/8/88/Shaheen_Afridi_2023.jpg",
  "MS Dhoni": "https://upload.wikimedia.org/wikipedia/commons/3/33/MS_Dhoni_2019.jpg",
  "Jos Buttler": "https://upload.wikimedia.org/wikipedia/commons/f/f2/Jos_Buttler_2022.jpg",
  "Rishabh Pant": "https://upload.wikimedia.org/wikipedia/commons/1/1f/Rishabh_Pant_2022.jpg",
  "Heinrich Klaasen": "https://upload.wikimedia.org/wikipedia/commons/2/2e/Heinrich_Klaasen_2022.jpg",
  "Quinton de Kock": "https://upload.wikimedia.org/wikipedia/commons/7/7a/Quinton_de_Kock_2022.jpg",
  "Ben Stokes": "https://upload.wikimedia.org/wikipedia/commons/9/9a/Ben_Stokes_2019.jpg",
  "Hardik Pandya": "https://upload.wikimedia.org/wikipedia/commons/5/56/Hardik_Pandya_2023.jpg",
  "Shakib Al Hasan": "https://upload.wikimedia.org/wikipedia/commons/6/65/Shakib_Al_Hasan_2022.jpg",
  "Andre Russell": "https://upload.wikimedia.org/wikipedia/commons/9/9e/Andre_Russell_2022.jpg",
  "Glenn Maxwell": "https://upload.wikimedia.org/wikipedia/commons/f/f3/Glenn_Maxwell_2022.jpg",
  "Marcus Stoinis": "https://upload.wikimedia.org/wikipedia/commons/d/d9/Marcus_Stoinis_2022.jpg"
};

// Convert player names to filename format
function getFileName(playerName) {
  return playerName.toLowerCase().replace(/\s+/g, '_') + '.jpg';
}

// Download image from URL
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const file = fs.createWriteStream(filepath);
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete the file if error
      reject(err);
    });
  });
}

// Main function to download all images
async function downloadAllImages() {
  console.log('🚀 Starting to download player images...\n');
  
  let downloaded = 0;
  let failed = 0;
  
  for (const [playerName, imageUrl] of Object.entries(playerImages)) {
    const fileName = getFileName(playerName);
    const filePath = path.join(playersDir, fileName);
    
    // Skip if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`⏭️  ${playerName} - already exists, skipping`);
      continue;
    }
    
    try {
      await downloadImage(imageUrl, filePath);
      console.log(`✅ ${playerName} - downloaded successfully`);
      downloaded++;
    } catch (error) {
      console.log(`❌ ${playerName} - failed to download: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n✨ Download complete!`);
  console.log(`📊 Downloaded: ${downloaded}, Failed: ${failed}`);
  console.log(`📁 Images saved to: ${playersDir}\n`);
  
  if (failed === 0) {
    console.log('🎉 All player images downloaded successfully!');
    console.log('\n📝 Next step: The code is already configured to use these local images.');
    console.log('   Just run your app and the player images will appear automatically!\n');
  }
}

// Run the download
downloadAllImages().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
