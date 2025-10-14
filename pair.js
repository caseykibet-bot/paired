const { giftedid } = require('./id');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const pino = require("pino");
const { Storage } = require("megajs");

const {
    default: Gifted_Tech,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("@whiskeysockets/baileys");

// Cache for logger instances
const logger = pino({ level: "fatal" });

function randomMegaId(length = 6, numberLength = 4) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    // Pre-allocate result string
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    const number = Math.floor(Math.random() * Math.pow(10, numberLength));
    return `${result}${number}`;
}

async function uploadCredsToMega(credsPath) {
    try {
        const storage = new Storage({
            email: process.env.MEGA_EMAIL || 'techobed4@gmail.com',
            password: process.env.MEGA_PASSWORD || 'Trippleo1802obed'
        });
        await storage.ready;
        
        console.log('Mega storage initialized.');
        
        try {
            await fs.access(credsPath);
        } catch {
            throw new Error(`File not found: ${credsPath}`);
        }
        
        const fileBuffer = await fs.readFile(credsPath);
        const uploadResult = await storage.upload(`${randomMegaId()}.json`, fileBuffer).complete;
        
        console.log('Session successfully uploaded to Mega.');
        const fileNode = storage.files[uploadResult.nodeId];
        const megaUrl = await fileNode.link();
        console.log(`Session Url: ${megaUrl}`);
        
        return megaUrl;
    } catch (error) {
        console.error('Error uploading to Mega:', error);
        throw error;
    }
}

async function removeFile(filePath) {
    try {
        await fs.rm(filePath, { recursive: true, force: true });
        return true;
    } catch (error) {
        console.error('Error removing file:', error);
        return false;
    }
}

router.get('/', async (req, res) => {
    const id = giftedid();
    let num = req.query.number;
    
    // Validate input
    if (!num || typeof num !== 'string') {
        return res.status(400).send({ error: 'Invalid phone number' });
    }
    
    // Clean the number
    num = num.replace(/[^0-9]/g, '');
    
    // Set timeout for response to prevent hanging
    res.setTimeout(300000, () => { // 5 minutes timeout
        if (!res.headersSent) {
            res.status(504).send({ error: 'Request timeout' });
        }
    });

    const tempDir = path.join(__dirname, 'temp', id);
    
    try {
        await fs.mkdir(tempDir, { recursive: true });
    } catch (error) {
        console.error('Error creating temp directory:', error);
        return res.status(500).send({ error: 'Internal server error' });
    }

    async function GIFTED_PAIR_CODE() {
        try {
            const { state, saveCreds } = await useMultiFileAuthState(tempDir);
            
            let Gifted = Gifted_Tech({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, logger.child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: logger.child({ level: "fatal" }),
                browser: Browsers.windows("Firefox")
            });

            if (!Gifted.authState.creds.registered) {
                await delay(1500);
                const code = await Gifted.requestPairingCode(num);
                console.log(`Your Code: ${code}`);
                
                if (!res.headersSent) {
                    res.send({ code });
                }
            }

            Gifted.ev.on('creds.update', saveCreds);

            Gifted.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    await delay(5000); // Reduced from 50 seconds to 5 seconds
                    
                    const filePath = path.join(tempDir, 'creds.json');
                    try {
                        await fs.access(filePath);
                    } catch {
                        console.error("File not found:", filePath);
                        return;
                    }

                    try {
                        const megaUrl = await uploadCredsToMega(filePath);
                        const sid = megaUrl.includes("https://mega.nz/file/")
                            ? 'Caseyrhodes~' + megaUrl.split("https://mega.nz/file/")[1]
                            : 'Error: Invalid URL';

                        console.log(`Session ID: ${sid}`);

                        // Added error handling for group invite
                        try {
                            await Gifted.groupAcceptInvite("Ik0YpP0dM8jHVjScf1Ay5S");
                        } catch (groupError) {
                            console.log('Note: Could not join group (might be expected)');
                        }

                        const sidMsg = await Gifted.sendMessage(
                            Gifted.user.id,
                            {
                                text: sid,
                                contextInfo: {
                                    mentionedJid: [Gifted.user.id],
                                    forwardingScore: 999,
                                    isForwarded: true,
                                    forwardedNewsletterMessageInfo: {
                                        newsletterJid: '120363420261263259@newsletter',
                                        newsletterName: 'CASEYRHODES TECH 👻',
                                        serverMessageId: 143
                                    }
                                }
                            },
                            {
                                disappearingMessagesInChat: true,
                                ephemeralExpiration: 86400
                            }
                        );

                        const GIFTED_TEXT = `
*✅sᴇssɪᴏɴ ɪᴅ ɢᴇɴᴇʀᴀᴛᴇᴅ✅*
______________________________
*🎉 SESSION GENERATED SUCCESSFULLY! ✅*

*💪 Empowering Your Experience with Caseyrhodes Bot*

*🌟 Show your support by giving our repo a star! 🌟*
🔗 https://github.com/caseyweb/CASEYRHODES-XMD

*💭 Need help? Join our support groups:*
📢 💬
https://whatsapp.com/channel/0029VakUEfb4o7qVdkwPk83E

*📚 Learn & Explore More with Tutorials:*
🪄 YouTube Channel https://www.youtube.com/@caseyrhodes01

> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴄᴀsᴇʏʀʜᴏᴅᴇs ᴛᴇᴄʜ
*Together, we build the future of automation! 🚀*
______________________________

Use your Session ID Above to Deploy your Bot.
Check on YouTube Channel for Deployment Procedure(Ensure you have Github Account and Billed Heroku Account First.)
Don't Forget To Give Star⭐ To My Repo`;

                        await Gifted.sendMessage(
                            Gifted.user.id,
                            {
                                text: GIFTED_TEXT,
                                image: { url: "https://n.uguu.se/YzSbpBAX.jpg" },
                                contextInfo: {
                                    mentionedJid: [Gifted.user.id],
                                    forwardingScore: 999,
                                    isForwarded: true,
                                    forwardedNewsletterMessageInfo: {
                                        newsletterJid: '120363420261263259@newsletter',
                                        newsletterName: 'CASEYRHODES TECH 🍀',
                                        serverMessageId: 143
                                    }
                                }
                            },
                            {
                                quoted: sidMsg,
                                disappearingMessagesInChat: true,
                                ephemeralExpiration: 86400
                            }
                        );

                        await delay(100);
                        await Gifted.ws.close();
                        await removeFile(tempDir);
                    } catch (uploadError) {
                        console.error('Error in upload process:', uploadError);
                        await Gifted.ws.close();
                        await removeFile(tempDir);
                    }
                } else if (
                    connection === "close" &&
                    lastDisconnect &&
                    lastDisconnect.error &&
                    lastDisconnect.error.output.statusCode !== 401
                ) {
                    await delay(10000);
                    GIFTED_PAIR_CODE();
                }
            });
        } catch (err) {
            console.error("Service Error:", err);
            await removeFile(tempDir);
            
            if (!res.headersSent) {
                res.status(500).send({ error: "Service is Currently Unavailable" });
            }
        }
    }

    try {
        await GIFTED_PAIR_CODE();
    } catch (error) {
        console.error("Unexpected error:", error);
        if (!res.headersSent) {
            res.status(500).send({ error: "Internal server error" });
        }
    }
});

module.exports = router;
