from channels import Group

def ws_add(message):
   message.reply_channel.send({"accept": True})
    #Add to the chat group
   Group("chat").add(message.reply_channel)
   Group("element").add(message.reply_channel)

def ws_message(message):
   Group("chat").send({
       "text": message.content['text'],
   })
   Group("element").send({
      "text": message.content['text'],
   })

def ws_disconnect(message):
   Group("chat").discard(message.reply_channel)
   Group("element").discard(message.reply_channel)