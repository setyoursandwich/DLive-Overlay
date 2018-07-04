"use strict";

/**
 * Object global overlay constructor function that returns a object literal
 * returning an object literal will cause that the private properties that aren't returned in the object can't be overwritten by properties with the same name 
 * @params {string} author The steemit account of the streamer
 * @params {string} permlink The last uri part of the streamer's steemit post, this resembles the last uri part of the DLive stream as well
 * @params {string} voice Specify which voice to use for text to voice. Go to: https://responsivevoice.org/ for a full list of voices
 */

let DLOverlay = function(author, permlink, voice){
            
    let self = this;
    
    self.author = author;
    self.permlink = permlink;
    self.voice = voice;
    self.switcheroo = 1;
    self.votesHistory = [];
    self.replyHistory = [];
    self.playing = false;
    
    self.speakandshowQueue = [];
    
    // private methods
    
    /**
     * Make a call to steemit's api
     * @params {string} method specify which method to use in the api 
     * @params {array} params the parameters we send to the api's specific method
     * @params {function}callback if succesfull trigger this function
     */
    
    function apiCall(method, params, callback){
        let request = {
            method: method,
            params: params,
            id: 1,
            jsonrpc: "2.0"
        }
        
        $.ajax({
            url: "https://api.steemit.com",
            type: "POST",
            data: JSON.stringify(request),
            datatype: "json",
            headers: {
                "Content-Type": "application/json"
            },
            success: function(response){
                if( response !== undefined ){
                    callback( response );
                }
            }
        })
    }
    
    /**
    * get the next item in the playqueue, remove it from the playqueue and trigger the speak and show method with the data
    * if after completion the playqueue is not empty recursevely trigger the method again
    */
    
    function playQueue(){
        let sASPars = self.speakandshowQueue.shift();
        speakAndShow(sASPars.author, sASPars.writtenText, sASPars.spokenText, sASPars.fadeInCallBack, function(){
            sASPars.fadeOutCallBack();
            if( self.speakandshowQueue.length > 0){
                playQueue;
            }
        })
        
    }
    
    /**
     * trigger the text to speech and show the text over the screen, play a sound effect after the text is spoken and wait with fading out until the audio is done
     * @params {string} author the message to display in the author box
     * @params {string} writtenText the message that will be shown in the text box
     * @params {string} spokenText the message that will be spoken by the text to speech api
     * @params {function} soundStartsCallBack trigger a function when the audio starts
     * @params {function} soundEndsCallBack trigger a function when audio ends
     */
    
    let speakAndShow = function( author, writtenText, spokenText, soundStartsCallBack, soundEndsCallBack ){
        
        //let the system know something is playing
        self.playing = true;
        //select authorBox and append author
        $(".author").html( author );
        //select messagebox and append text
        $(".message").html( writtenText );
        //fade the message in
        $("#msgWrapper").fadeToggle( "slow", function(){
            //play the message when fully visible
            responsiveVoice.speak(spokenText, self.voice, {onstart: soundStartsCallBack, onend: function(){
                //play the audio after the message has been spoken
                let sound = new Audio('assets/audio/vote.mp3');
                sound.play();
                //fade out when the audio is done and call the callback when fully completed
                sound.addEventListener("ended", function(){
                    $("#msgWrapper").fadeToggle( "slow", 
                        function(){
                            //let the system know nothing is playing before calling the soundEndsCallBack
                            //calling the callback first can cause that we accidentally overwrite a playing put to true in the callback
                            self.playing = false;
                            soundEndsCallBack();
                        }
                     );
                })
            }});
        })
    }

    
    //public methods
    
    /**
     * start the loop which will:
     * Check if something is playing and if not if there is something in que that needs to be played
     * check for new data to add to the playing queue
     */
    let start = function() {
        let loopChecking = setInterval( function(){
            if( !self.playing && self.speakandshowQueue.length > 0 ){
                playQueue();
            }

            switch( self.switcheroo ){
                case 1: 
                    //mention the upvoters
                    getContent( function(response){
                        
                        let voteList = response.result.votes;
                        
                        //loop all object in response
                        for( let o of voteList ){
                            //check if we already triggered a show and speak with this upvote
                            let found = self.votesHistory.find( val => val == o.voter )?true:false;
                            
                            //if value doesn't exist this speak and show has not yet been displayed, add it to the handle list and to the play que  
                            if( found === false ){
                                //add it to the handled list
                                self.votesHistory.push( o.voter );
                                //get the voter
                                let voter = o.voter;
                                //get the percentage for which they vote
                                let percent = o.percent;
                                percent = percent / 100;
                                //add the percent to a custom message
                                let message = `voted for ${percent} percent`;
                                
                                //add it to the play que
                                addSpeakAndShow(voter, `${message}<br><img src="assets/images/vote.gif" style="width: 350px; height:200px;">`, `${voter} ${message}`, function(){ }, function(){});
                            }
                        }
                    });
                    self.switcheroo = 2;
                break;
                //text to speech text
                case 2: 
                    getContentReplies( function(response){
                        
                        let replyList = response.result.discussions;
                        
                        //loop all object in response
                        for( let o of replyList ){
                            //if the message has been played or the author did not upvote the stream put found to true to not trigger the speak and show
                            let found = self.replyHistory.find( val => val == o.author ) || !self.votesHistory.find( val => val == o.author )?true:false;
                            
                            //if value doesn't exist and the author upvoted  add it to the handle list and to the play que  
                            if( found === false ){
                                //add it to the handled list
                                self.replyHistory.push( o.author );
                                //get the author
                                let commenter = o.author;
                                //get the message
                                let message = o.body;

                                //add it to the play que
                                addSpeakAndShow(commenter, message, message, function(){}, function(){});
                            }
                        }
                    });
                    
                    self.switcheroo = 1;
                break;
            }
        }, 2500)
        
    }
    
    /**
     * make a call to steemit's api to get the votes of the article that is linked with the livestream
     * @params {function} callback A function to execute when we've succesfully gotten a response from the api, use a response parameter to handle the server's response in the function
     */
     
    let getContent = function( callback ){
        apiCall('tags_api.get_active_votes', {
            "author": self.author, 
            "permlink":self.permlink
            }, callback);
    }
    
     /**
     * make a call to steemit's api to get the replies of the article that is linked with the livestream
     * @params {function} callback A function to execute when we've succesfully gotten a response from the api, use a response parameter to handle the server's response in the function
     */
    
    let getContentReplies = function( callback ){
        apiCall('tags_api.get_content_replies',  {
            "author":self.author,
            "permlink":self.permlink
        }, callback)
    }
    
    //add commands to the speakandshowQueue
    /**
     * Add an object that has properties with values that resemble the parameters of the speakAndShow method to the speakandshowQueue array}
     * Has to be added as an object not an array so we can use the exact same keys instead of index numbers
     * @params {string} author the message to display in the author box
     * @params {string} writtenText the message that will be shown in the text box
     * @params {string} spokenText the message that will be spoken by the text to speech api
     * @params {function} soundStartsCallBack trigger a function when the audio starts
     * @params {function} soundEndsCallBack trigger a function when audio ends
     */
    function addSpeakAndShow(author, writtenText, spokenText, fadeInCallBack, fadeOutCallBack){
        let action = {
            'author': author,
            'writtenText': writtenText,
            'spokenText': spokenText,
            'fadeInCallBack': fadeInCallBack,
            'fadeOutCallBack': fadeOutCallBack
        }
        self.speakandshowQueue.push( action );
    }
    
    /**
     * return an object with all the global properties and methods
     */
    
    return{
        addSpeakAndShow:            addSpeakAndShow,
        getContent:                 getContent,
        getContentReplies:          getContentReplies,
        start:                      start
    }
}