# spiral_greetings - Simple greeting commands
# This is a DSL plugin - no JavaScript needed!

COMMAND hello "Say hello to the bot"
  ALIASES hi, hey, greetings
  COOLDOWN 3
  RESPONSE_POOL
    Hello {user.name}! How are you?
    Hey {user.name}! What's up?
    Hi there {user.name}! Nice to see you!
    Greetings {user.name}! Welcome!
  END
END

COMMAND goodbye "Say goodbye"
  ALIASES bye, see ya
  RESPONSE_POOL
    Goodbye {user.name}! See you later!
    Bye {user.name}! Take care!
    See ya {user.name}! Come back soon!
    Farewell {user.name}! Until next time!
  END
END

COMMAND welcome "Welcome a new member"
  ALIASES greet
  REQUIRES_PERMISSION MANAGE_MESSAGES
  RESPONSE_POOL
    Welcome to the server, {args}!
    Glad to have you here, {args}!
    Welcome aboard, {args}! Enjoy your stay!
  END
END

COMMAND joke "Tell a random joke"
  ALIASES pun
  RESPONSE_POOL
    Why don't scientists trust atoms? Because they make up everything!
    What do you call a fake noodle? An impasta!
    Why did the scarecrow win an award? He was outstanding in his field!
    What do you call a bear with no teeth? A gummy bear!
    Why don't eggs tell jokes? They'd crack each other up!
  END
END

COMMAND quote "Get a random quote"
  EMBED "#00FF00"
  TITLE "Random Quote"
  DESCRIPTION "The only way to do great work is to love what you do. - Steve Jobs"
END