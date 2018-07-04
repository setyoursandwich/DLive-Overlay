"use strict";

let DLOverlay = function(author, permlink, voice){
			
	let self = this;
	
	self.author = author;
	self.permlink = permlink;
	self.voice = voice;
	self.switcheroo = 1;
	self.votesHistory = [];
	self.replyHistory = [];
	self.playing = false;
	
	self.speakandshowQue = [];
	
	//private methods
	function apiCall(method, params, callback){
		let request = {
			method : 	method,
			params: 	params,
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
	
	function playQue(){
		//get the data
		let sASPars = self.speakandshowQue.shift();
		//call speakAndShow function
		speakAndShow(sASPars.author, sASPars.writtenText, sASPars.spokenText, sASPars.fadeInCallBack, function(){
			sASPars.fadeOutCallBack();
			//data left? trigger this method again to chain it
			if( self.speakandshowQue.length > 0){
				playQue;
			}
		})
		
	}
	
	let speakAndShow = function( author, writtenText, spokenText, fadeInCallBack, fadeOutCallBack ){
		
		console.log( arguments );
		
		//let the system know something is playing
		self.playing = true;
		//select authorBox and append author
		$(".author").html( author );
		//select messagebox and append text
		$(".message").html( writtenText );
		//fade the message in
		$("#msgWrapper").fadeToggle( "slow", function(){
			//play the message when fully visible
			responsiveVoice.speak(spokenText, self.voice, {onstart: fadeInCallBack, onend: function(){
				//play the audio after the message has been spoken
				let sound = new Audio('assets/audio/vote.mp3');
				sound.play();
				//fade out when the audio is done and call the callback when fully completed
				sound.addEventListener("ended", function(){
					$("#msgWrapper").fadeToggle( "slow", 
						function(){
							//let the system know nothing is playing before calling the fadeOutCallBack
							//calling the callback first can cause that we accidentally overwrite a playing put to true in the callback
							self.playing = false;
							fadeOutCallBack();
						}
					 );
				})
			}});
		})
	}

	
	//public methods
	let start = function() {
		let loopChecking = setInterval( function(){
			if( !self.playing && self.speakandshowQue.length > 0 ){
				playQue();
			}
			console.log( self.votesHistory );
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
	
	let getContent = function( callback ){
		apiCall('tags_api.get_active_votes', {
			"author": self.author, 
			"permlink":self.permlink
			}, callback);
	}
	
	let getContentReplies = function( callback ){
		apiCall('tags_api.get_content_replies',  {
			"author":self.author, 
			"permlink":self.permlink
		}, callback)
	}
	
	//add commands to the speakandshowQue
	function addSpeakAndShow(author, writtenText, spokenText, fadeInCallBack, fadeOutCallBack){
		let action = {
			'author': 			author,
			'writtenText': 		writtenText,
			'spokenText': 		spokenText,
			'fadeInCallBack':	fadeInCallBack,
			'fadeOutCallBack': 	fadeOutCallBack
		}
		self.speakandshowQue.push( action );
	}
	
	return{
		getContent:					getContent,
		getContentReplies:			getContentReplies,
		addSpeakAndShow: 			addSpeakAndShow,
		start:						start
	}
}