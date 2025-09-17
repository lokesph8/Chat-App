import React, { useContext, useEffect, useRef, useState } from 'react'
import assets from '../assets/assets'
import { formatMessageTime } from '../lib/utilis'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import EmojiPicker from 'emoji-picker-react'

// --- Helper: Format message text with clickable links ---
const formatMessage = (text) => {
    if (!text) return null
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return text.split(urlRegex).map((part, index) => {
        if (part.match(urlRegex)) {
            return (
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline hover:text-blue-600"
                >
                    {part}
                </a>
            )
        }
        return part
    })
}

const ChatContainer = () => {
    const { messages, selectedUser, setSelectedUser, sendMessage, getMessages } = useContext(ChatContext)
    const { authUser, onlineUsers } = useContext(AuthContext)

    const scrollEnd = useRef()
    const [input, setInput] = useState('')
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const emojiRef = useRef(null)

    // --- Send text message ---
    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (input.trim() === "") return
        await sendMessage({ text: input.trim() })
        setInput('')
        setShowEmojiPicker(false)
    }

    // --- Send image ---
    const handleSendImage = async (e) => {
        const file = e.target.files[0]
        if (!file || !file.type.startsWith("image/")) {
            toast.error("Select an image file")
            return
        }
        if (file.size > 100 * 1024 * 1024) {
            toast.error("Image size must be less than 100MB")
            return
        }
        const reader = new FileReader()
        reader.onloadend = async () => {
            await sendMessage({ image: reader.result })
            e.target.value = ""
        }
        reader.readAsDataURL(file)
    }

    // --- Send video ---
    const handleSendVideo = async (e) => {
        const file = e.target.files[0]
        if (!file || !file.type.startsWith("video/")) {
            toast.error("Select a video file")
            return
        }
        if (file.size > 100 * 1024 * 1024) {
            toast.error("Video size must be less than 100MB")
            return
        }
        const reader = new FileReader()
        reader.onloadend = async () => {
            await sendMessage({ video: reader.result })
            e.target.value = ""
        }
        reader.readAsDataURL(file)
    }

    // --- Fetch messages when selected user changes ---
    useEffect(() => {
        if (selectedUser) {
            getMessages(selectedUser._id)
        }
    }, [selectedUser])

    // --- Scroll to bottom when messages update ---
    useEffect(() => {
        if (scrollEnd.current && messages) {
            scrollEnd.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    // --- Close emoji picker when clicking outside ---
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (emojiRef.current && !emojiRef.current.contains(e.target)) {
                setShowEmojiPicker(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return selectedUser ? (
        <div className='h-full overflow-scroll relative backdrop-blur-lg'>
            {/* Header */}
            <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
                <img
                    src={selectedUser.profilePic || assets.avatar_icon}
                    alt=""
                    className='w-10 aspect-[1/1] rounded-full object-cover'
                />
                <p className='flex-1 text-lg text-white flex items-center gap-2'>
                    {selectedUser.fullName}
                    {onlineUsers.includes(selectedUser._id) && <span className='w-2 h-2 rounded-full bg-green-500'></span>}
                </p>
                <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="" className='md:hidden max-w-7' />
                <img src={assets.help_icon} alt="" className='max-md:hidden max-w-5' />
            </div>

            {/* Chat area */}
            <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
                {messages.map((msg, index) => {
                    const isSender = msg.senderId === authUser._id
                    return (
                        <div key={index} className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}>
                            <div className={`flex items-end gap-2 ${isSender ? 'justify-end' : 'justify-start'}`}>
                                {/* Avatar */}
                                {!isSender && (
                                    <img
                                        src={selectedUser?.profilePic || assets.avatar_icon}
                                        alt=""
                                        className='w-8 aspect-[1/1] rounded-full object-cover'
                                    />
                                )}

                                {/* Message */}
                                {msg.image && (
                                    <img
                                        src={msg.image}
                                        alt=""
                                        className={`max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-2
                                            ${isSender ? 'ml-auto' : 'mr-auto'}`}
                                    />
                                )}
                                {msg.video && (
                                    <video
                                        controls
                                        className={`max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-2
                                            ${isSender ? 'ml-auto' : 'mr-auto'}`}
                                    >
                                        <source src={msg.video} type="video/mp4" />
                                    </video>
                                )}
                                {!msg.image && !msg.video && msg.text && (
                                    <p
                                        className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-2 break-words text-white
                                        ${isSender ? 'bg-violet-500/30 rounded-br-none ml-auto' : 'bg-gray-700/30 rounded-bl-none mr-auto'}`}
                                    >
                                        {formatMessage(msg.text)}
                                    </p>
                                )}

                                {/* Avatar for sender */}
                                {isSender && (
                                    <img
                                        src={authUser?.profilePic || assets.avatar_icon}
                                        alt=""
                                        className='w-8 aspect-[1/1] rounded-full object-cover'
                                    />
                                )}
                            </div>

                            {/* Message time */}
                            <span className="text-[10px] text-gray-400 px-2">
                                {formatMessageTime(msg.createdAt)}
                            </span>
                        </div>
                    )
                })}
                <div ref={scrollEnd}></div>
            </div>

            {/* Bottom input area */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
  <div className="flex items-center">

    {/* Input wrapper (takes remaining space) */}
    <div className="flex flex-1 items-center bg-gray-100/12 px-3 rounded-full">

      {/* Emoji */}
      <img
        src={assets.emoji_icon}
        alt="emoji"
        className="w-6 h-6 mr-2 cursor-pointer flex-shrink-0"
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
      />

      {showEmojiPicker && (
        <div ref={emojiRef} className="absolute bottom-14 right-12 z-10">
          <EmojiPicker
            onEmojiClick={(emojiData) => setInput((prev) => prev + emojiData.emoji)}
            theme="dark"
          />
        </div>
      )}

      {/* Text input */}
      <input
        onChange={(e) => setInput(e.target.value)}
        value={input}
        onKeyDown={(e) => e.key === "Enter" ? handleSendMessage(e) : null}
        type="text"
        placeholder="Send a message"
        className="flex-grow min-w-0 text-sm p-3 border-none outline-none text-white placeholder-gray-400 bg-transparent"
      />

      {/* Gallery */}
      <input onChange={handleSendImage} type="file" id="image" accept="image/png, image/jpeg" hidden />
      <label htmlFor="image">
        <img src={assets.gallery_icon} alt="" className="w-6 h-6 ml-2 cursor-pointer flex-shrink-0" />
      </label>

      {/* Video */}
      <input onChange={handleSendVideo} type="file" id="video" accept="video/*" hidden />
      <label htmlFor="video">
        <img src={assets.video_icon} alt="" className="w-6 h-6 ml-2 cursor-pointer flex-shrink-0" />
      </label>
    </div>

    {/* Send button (always visible, space reserved) */}
    <img
      onClick={handleSendMessage}
      src={assets.send_button}
      alt="send"
      className="w-10 h-10 ml-3 cursor-pointer flex-shrink-0"
    />
  </div>
</div>


        </div>
    ) : (
        <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
            <img src={assets.logo_icon} className='max-w-16' alt="" />
            <p className='text-lg font-medium text-white'>Chat anytime, anywhere</p>
        </div>
    )
}

export default ChatContainer
