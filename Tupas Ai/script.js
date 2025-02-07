const typingForm=document.querySelector(".typing-form")
const chatList=document.querySelector(".chat-list")

const suggestions=document.querySelectorAll(".suggestion-list .suggestion")
const toggleTheme=document.querySelector("#toggle-theme-button")
const deleteChat=document.querySelector('#delete-chat-button')
let userMessage=null;
let isResponseGenerating=false;
const API_KEY="AIzaSyBBaq0PyIOz1Ho4WsKfsL8VUD7BicZdx_E"
const API_URL=`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`



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

    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, codeContent) => {
        language = language || "plaintext";  
        return `
            <div class="code-container">
                <div class="copy-icons" onclick="copyCode(this)">
                    <span onClick="copyCode(this)" class=" material-symbols-outlined copy">content_copy</span>
                </div>
                <pre><code class="language-${language}">${escapeHTML(codeContent)}</code></pre>
            </div>`;
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
            <p class="text"></p>
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