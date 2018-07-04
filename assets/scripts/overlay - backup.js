"use strict";

let DLOverlay = function(author, permlink, voice){
			
	let self = this;
	
	self.author = author;
	self.permlink = permlink;
	self.voice = voice;
	self.switcheroo = 1;
	self.votesHistory = []
	self.messageHistory = [];
	self.playing = false;
	
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
	
	function addToSpeakAndShowQue(){
		
	}
	
	//public methods
	let start = function() {
		let loopChecking = setInterval(function(){
			if( !self.playing ){
				console.log( self.playing );
				switch( self.switcheroo ){
					case 1: 
						//mention the upvoters
						getContent( function(response){
							
							let voteList = response.result.votes;
							//let newVotes = voteList.slice(self.votesHistory.length, voteList.length);
							
							let recursiveSpeakAndShow = function(i){
								
								
								let voter = voteList[i]['voter'];
								
								let percent = voteList[i]['percent'];
								percent = percent / 100;
								
								let message = 'voted for '+percent+ ' percent';
								
								let found = false;
								//for loop instead for foreach so we can break after we found the value;
								for(let o of self.votesHistory){
									if( o.voter === voter){
										found = true;
										break;
									}
								}
								
								if( found === false ){
									//push the new voter in the handled list and fire the speak and show method
									self.votesHistory.push( voteList[i] );
									speakAndShow(voter, message + '<br><img src="assets/images/vote.gif" style="width: 350px; height:200px;">', voter + " " +message, function(){ }, function(){ 
									if( i < voteList.length-1 ){
											let index = i+1;
											recursiveSpeakAndShow( index );
										}
									});
								}else if( i < voteList.length-1 ){
									let index = i+1;
									recursiveSpeakAndShow( index );
								}
							}
							
							if( voteList.length > 0 ){
								
								recursiveSpeakAndShow( 0 );
							}
						});
						self.switcheroo = 2;
					break;
					//text to speech text
					case 2: 
						getContentReplies( function(response){
							
							let replyList = response.result.discussions;
							let newReplies = replyList.slice(self.messageHistory.length, replyList.length);
							console.log( newReplies );
							let recursiveSpeakAndShow = function(i){
								console.log( i );
								let commenter = newReplies[i].author;
								let message = newReplies[i].body;
								
								console.log(commenter+":"+message);
								let resultFound = false;
								
								for( let j = 0; j < self.votesHistory.length; j++ ){
									if(commenter === self.votesHistory[j]['voter'] ){
										
										speakAndShow(commenter, message, message, function(){}, function(){
											if( i < newReplies.length-1 ){
												let index = i+1;
												recursiveSpeakAndShow(index);
											}
										});
										
										break;
									}
									
								}
								
								if( resultFound === false ){
									if( i < newReplies.length-1 ){
										let index = i+1;
										console.log(index+":"+newReplies.length);
										recursiveSpeakAndShow(index);
									}else{
									}
								}
							}
							
							if( newReplies.length > 0 ){
								recursiveSpeakAndShow(0);
							}
							
							self.messageHistory = replyList;
						});
						
						self.switcheroo = 1;
					break;
				}
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
	
	let speakAndShow = function( author, writtenText, spokenText, fadeInCallBack, fadeOutCallBack ){
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
	
	return{
		getContent:			getContent,
		getContentReplies:	getContentReplies,
		speakAndShow: 		speakAndShow,
		start:				start
	}
}