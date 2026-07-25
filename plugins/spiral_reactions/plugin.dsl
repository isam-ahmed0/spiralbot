# spiral_reactions - Fun reaction commands
# This is a DSL plugin - no JavaScript needed!

COMMAND hug "Hug someone"
  ALIASES embrace, cuddle
  COOLDOWN 5
  REQUIRES_ARGS "Usage: !hug <user>"
  RESPONSE_POOL
    {user.name} hugs {args} tightly! 
    {user.name} gives {args} a warm bear hug!
    {user.name} wraps {args} in a big hug!
  END
END

COMMAND slap "Slap someone"
  ALIASES smack, hit
  COOLDOWN 5
  REQUIRES_ARGS "Usage: !slap <user>"
  RESPONSE_POOL
    {user.name} slaps {args} across the face!
    {user.name} gives {args} a big slap!
    {user.name} smacks {args}!
  END
END

COMMAND highfive "High five someone"
  ALIASES hf
  COOLDOWN 3
  REQUIRES_ARGS "Usage: !highfive <user>"
  RESPONSE_POOL
    {user.name} high fives {args}!
    {user.name} and {args} share an epic high five!
    *SLAP* {user.name} high fives {args}!
  END
END

COMMAND pat "Pat someone's head"
  ALIASES headpat
  COOLDOWN 3
  REQUIRES_ARGS "Usage: !pat <user>"
  RESPONSE_POOL
    {user.name} pats {args} on the head!
    {user.name} gives {args} a gentle pat!
    *pat pat* {user.name} pats {args}!
  END
END

COMMAND wave "Wave at someone"
  ALIASES hello
  COOLDOWN 3
  RESPONSE_POOL
    {user.name} waves at {args}!
    {user.name} waves enthusiastically!
    {user.name} waves hello to everyone!
  END
END

COMMAND flip "Flip a coin"
  ALIASES coinflip
  COOLDOWN 2
  EMBED "#FFD700"
  TITLE "Coin Flip"
  DESCRIPTION "Heads!"
END

COMMAND roll "Roll a dice"
  ALIASES dice
  COOLDOWN 2
  EMBED "#FF6B6B"
  TITLE "Dice Roll"
  DESCRIPTION "You rolled a 6!"
END