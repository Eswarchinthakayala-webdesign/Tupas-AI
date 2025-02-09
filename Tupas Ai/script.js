const typingForm=document.querySelector(".typing-form")
const chatList=document.querySelector(".chat-list")

const suggestions=document.querySelectorAll(".suggestion-list .suggestion")
const toggleTheme=document.querySelector("#toggle-theme-button")
const deleteChat=document.querySelector('#delete-chat-button')
let userMessage=null;
let isResponseGenerating=false;
const API_KEY="AIzaSyBBaq0PyIOz1Ho4WsKfsL8VUD7BicZdx_E"
const API_URL=`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`
const sendButton = document.querySelector(".typing-form .input-wrapper .icon:last-child");

        const voiceInputButton = document.querySelector("#voice-input-button");
        const typingInput = document.querySelector(".typing-input");

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        typingInput.addEventListener("keyup", () => {
            if (typingInput.value.trim() !== "") {
                voiceInputButton.style.display = "none"; 
                sendButton.style.display = "inline-flex"; 
            } else {
                voiceInputButton.style.display = "inline-flex"; 
                sendButton.style.display = "none"; 
            }
        });
        
        
        sendButton.style.display = "none";
        
        if (SpeechRecognition) {
            
            const recognition = new SpeechRecognition();
            recognition.lang = "en-US";
            recognition.interimResults = false;

            voiceInputButton.addEventListener("click", () => {
                recognition.start();
                voiceInputButton.innerText="waves"
                voiceInputButton.classList.add("listening");
            });
            
            recognition.onresult = (event) => {
                typingInput.value = event.results[0][0].transcript;
                if (typingInput.value.trim() !== "") {
                    voiceInputButton.style.display = "none"; 
                    sendButton.style.display = "inline-flex"; 
                } else {
                    voiceInputButton.style.display = "inline-flex"; 
                    sendButton.style.display = "none"; 
                }
                
            };

            recognition.onspeechend = () => {
                recognition.stop();
                voiceInputButton.classList.remove("listening");
                setTimeout(() => {
                    voiceInputButton.innerText = "mic"; // Ensure mic icon resets after listening stops
                }, 500);
            };
        } else {
            console.warn("Speech Recognition API not supported in this browser.");
             voiceInputButton.innerText="mic"
        }
        


        const loadLocalStorageData=()=>
            {
            
                const savedChats=localStorage.getItem("savedChats")
                const isLightMode=(localStorage.getItem("themeColor")==="light_mode")
                document.body.classList.toggle("light_mode",isLightMode)
                toggleTheme.innerText=isLightMode?"dark_mode":"light_mode";
                chatList.innerHTML=savedChats||""
                document.body.classList.toggle('hide-header',savedChats)
                chatList.scrollTo(0,chatList.scrollHeight)
            }
            loadLocalStorageData()
            const createMessageElement=(content,...classes)=>
            {
                const div=document.createElement("div")
                div.classList.add("message",...classes)
                div.innerHTML=content
                return div
            }
            
            const showTypingEffect = (text, textElement, incomingMessageDiv) => { 
                console.log(text);
                incomingMessageDiv.classList.remove("loading");
            
                // Array of emojis for bullet points
                const emojis = ["🔥", "⚡", "🚀", "✅", "💡", "🌟", "🎯", "🛠️", "📌", "🔍"];
                
                // Step 1: Extract and replace code blocks with placeholders
                const codeBlocks = [];
                text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, codeContent) => {
                    language = language ? language.toLowerCase() : 'plaintext';
                    if (language === 'c++') language = 'cpp';
                    if (language === 'c#') language = 'csharp';
                    
                    const placeholder = `{{CODE_BLOCK_${codeBlocks.length}}}`;
                    codeBlocks.push({
                        placeholder,
                        content: `
                            <div class="code-container">
                                <div class="copy-icons" onclick="copyCode(this)">
                                    <span class="material-symbols-outlined copy">content_copy</span>
                                </div>
                                <pre><code class="language-${language}">${escapeHTML(codeContent)}</code></pre>
                            </div>`
                    });
                    return placeholder; // Replace the code block with a temporary placeholder
                });
            
                // Step 2: Replace `*` (only outside code blocks)
                text = text.replace(/(\s)\*(\s)/g, '<br>$1✱$2');
                const em=emojis[Math.floor(Math.random() * emojis.length)] // Replace " a * b " with " a ✱ b " to avoid breaking math expressions
                text = text.replace(/\✱ /g, () => `<br>${em} `); // Bullet point replacement
            
                // Step 3: Restore code blocks
                codeBlocks.forEach(({ placeholder, content }) => {
                    text = text.replace(placeholder, content);
                });
            
                textElement.innerHTML = text;
            
                setTimeout(() => {
                    document.querySelectorAll("pre code").forEach((block) => {
                        if (typeof Prism !== "undefined") {
                            Prism.highlightElement(block);
                        } else if (typeof hljs !== "undefined") {
                            hljs.highlightElement(block);
                        }
                    });
                }, 10);
                
                isResponseGenerating = false;
                localStorage.setItem("savedChats", chatList.innerHTML);
                chatList.scrollTo(0, chatList.scrollHeight);
            };
            
            
            
            
            
            
            
            
            
            
            const escapeHTML = (str) => {
                return str.replace(/&/g, "&amp;")
                          .replace(/</g, "&lt;")
                          .replace(/>/g, "&gt;")
                          .replace(/"/g, "&quot;")
                          .replace(/'/g, "&#039;");
            };
            
            
            
            suggestions.forEach(suggestion => {
                suggestion.addEventListener('click',()=>
                {
                    userMessage=suggestion.querySelector(".text").innerText
                    handleOutgoingChat()
                })
                
            });
            
            
            const generateAPIResponse=async (incomingMessageDiv)=>
            {  
                const textElement=incomingMessageDiv.querySelector(".text");
              
                try{
                     const response=await fetch(API_URL,{
            
                        method:"POST",
                        headers:{"Content-Type": "application/json"},
                        body:JSON.stringify(
                            {
                                contents:[{
                                    role:"user",
                                    parts:[{text:userMessage}]
                                }]
                            }
                        )
                     })
            
                     const data=await response.json()
                     if(!response.ok) throw new Error(data.error.message)
            
                    
                     const apiResponse=data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g,'$1')
                     showTypingEffect(apiResponse,textElement,incomingMessageDiv)
                   console.log(apiResponse)
                }
                catch(error)
                {  
                    isResponseGenerating=false;
                    textElement.innerText=error.message
                    textElement.classList.add("error")
                  
                }
                finally
                {
                    incomingMessageDiv.classList.remove("loading")
                }
            }
            
            const showLoadingAnimation=()=>
            {
              
                const html=`<div class="message-content">
                        <img src="assets/tupas.png" alt="Tupas image" class="avatar" alt="">
                        <div class="text"></div>
                        <div class="loading-indicator">
                            <div class="loading-bar"></div>
                            <div class="loading-bar"></div>
                            <div class="loading-bar"></div>
                             <div class="loading-bar"></div>
                        </div>
                    </div>
                    <span onClick="copyMessage(this)" class="icon material-symbols-outlined">content_copy</span>
            `
            const incomingMessageDiv=createMessageElement(html,"incoming","loading")
            
            chatList.appendChild(incomingMessageDiv)
            chatList.scrollTo(0,chatList.scrollHeight)
            generateAPIResponse(incomingMessageDiv)
            
            }
            const copyCode = (iconElement) => {
                const codeBlock = iconElement.closest(".code-container").querySelector("pre code");
                const textToCopy = codeBlock.innerText;
            
                navigator.clipboard.writeText(textToCopy)
                    .then(() => {
                        // Change only the clicked copy icon
                        iconElement.classList.add("copied");
                        iconElement.innerHTML = `<span class="material-symbols-outlined">done</span>`;
                        
                        setTimeout(() => {
                            iconElement.classList.remove("copied");
                            iconElement.innerHTML = `<span class="material-symbols-outlined">content_copy</span>`;
                        }, 1500);
                    })
                    .catch(err => console.error("Failed to copy:", err));
            };
            
            
            
            
            const copyMessage=(copyIcon)=>
            {
               const messageText=copyIcon.parentElement.querySelector(".text").innerText
               navigator.clipboard.writeText(messageText)
               copyIcon.innerText="done"
               setTimeout(()=> copyIcon.innerText="content_copy",1000)
            
            }
            
            const handleOutgoingChat=()=>
            {   
                voiceInputButton.style.display = "none"; 
                userMessage=document.querySelector(".typing-input").value.trim()||userMessage
                if(!userMessage || isResponseGenerating) return;
                isResponseGenerating=true
                console.log(userMessage)
                const html=`<div class="message-content">
                        <img src="assets/user.jpg" alt="user image" class="avatar" loading="lazy">
                        <p class="text"></p>
                    </div>
                `
                const outgoingMessageDiv=createMessageElement(html,"outgoing")
                outgoingMessageDiv.querySelector(".text").innerHTML=userMessage
                chatList.appendChild(outgoingMessageDiv)
                
                typingForm.reset()
                chatList.scrollTo(0,chatList.scrollHeight)
                document.body.classList.add('hide-header')
                setTimeout(showLoadingAnimation,500)
                voiceInputButton.style.display = "inline-flex"; 
            
            }
            
            
            toggleTheme.addEventListener("click",()=>
            {
                const isLightMode=document.body.classList.toggle("light_mode")
            
                localStorage.setItem("themeColor",isLightMode?"light_mode":"dark_mode")
                toggleTheme.innerText=isLightMode?"dark_mode":"light_mode";
            
            })
            
            deleteChat.addEventListener('click',()=>
            {
                if(confirm("Are you sure , you want to delete all Messages ?"))
                {
                    localStorage.removeItem("savedChats")
                    loadLocalStorageData();
                }
            })
            
            typingForm.addEventListener("submit",(e)=>
            {
                e.preventDefault();
                handleOutgoingChat();
            })
            sendButton.addEventListener("click", () => {
                handleOutgoingChat();
                voiceInputButton.style.display = "inline-flex"; 
            });