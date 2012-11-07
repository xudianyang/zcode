/**
 * @author wukezhan
 * @see http://lab.arc90.com/experiments/readability/ for other implements
 * 
 * 正文提取算法的jquery实现
 * 
 */

;(function($){
	"use strict";
	
	if(!$){
		throw 'Readable.js depends on jQuery or Zepto';
		return false;
	}
	
	function native2unicode(str){
		var tmp = '';
		for(var i=0, len = str.length; i<len; i++){
			var code=Number(str[i].charCodeAt(0));
			if(code>127){
				tmp += '&#'+str.charCodeAt(i)+';';
			}else{
				tmp += str[i];
			}
		}
		return tmp;
	}
	
	function replace($dom){
		var str = $dom.html();
		if(/charset=([\w|\-]+);?/.test(str)){
			str = str.replace(/charset=([\w|\-]+);?/, "");
		}
		str = str.replace(/<br\/?>[ \r\n\s]*<br\/?>/i, "</p><p>", str);
        str = str.replace(/<\/?font[^>]*>/i, "", str);
        return $.trim(str);
	}
	
	var defaults = {
		removable:{
			'tags':["link","style", "form", "iframe", "script", "button", "input", "textarea"],
			'csses':["style", "align", "border", "margin"],
			'events':["onclick", "onmouseover"]
		},
		strategies:[
		    {
		    	'types':['id','classname'],
		    	'regex':/(comment|meta|footer|footnote)/i,
		    	'score': -50
		    },
		    {
		    	'types':['classname'],
		    	'regex':/((^|\\s)(post|hentry|entry[-]?(content|text|body)?|article[-]?(content|text|body)?)(\\s|$))/i,
		    	'score': 25
		    },
		    {
		    	'types':['id'],
		    	'regex':/^(post|hentry|entry[-]?(content|text|body)?|article[-]?(content|text|body)?)$/i,
		    	'score': 25
		    },
		    {
		    	'types':['tagname'],
		    	'regex':/^(p)$/i,
		    	'score': 25
		    },
		    {
		    	'types':['tagname'],
		    	'regex':/^(div|span|pre|code|table)$/i,
		    	'score': 10
		    }
		]
	};
	
	/**
	 * @param {mixed} ele selector or jQuery Object 
	 * @param {object} opts
	 */
	function Readable(ele, opts){
		
		this.dom = $(ele).clone();
		
		this.opts = $.extend({}, defaults, opts||{});
		
		//do user initialize
		this.opts.init && this.opts.init.call(this);
		
		this.r = null;
		this.contestants = [];
		
		this.initialize();
	}
	
	Readable.prototype = {
		initialize:function(){
			//transform and clean the tags useless
			this.clean();
			this.dom.html((replace(this.dom)));
			
			return this;
		},
		clean:function(){
			var self = this;
			$.each(self.opts.removable.tags, function(index, item){
				self.removeTag(item);
			});
			$.each(self.opts.removable.csses, function(index, item){
				self.removeCss(item);
			});
			$.each(self.opts.removable.events, function(index, item){
				self.removeEvent(item);
			});
		},
		removeTag:function(tagName){
			this.dom.find(tagName).remove();
		},
		removeCss:function(css){
			$('['+css+']', this.dom).removeAttr(css);
		},
		removeEvent:function(event){
			$('['+event+']', this.dom).removeAttr(event);
		},
		test:function(){
			try{
				this.testRichText();
				var percentage = this.getReabability();
				if(percentage < 2){
					throw {type:'richtext', percentage:percentage};
				}
			}catch(e){
				//this.dom
				//this.testDivSpan();
				//var percentage = this.getReabability();
			}
			
			return this.r;
		},
		getReabability:function(){
			!this.domLength && (this.domLength = this.dom.text().length);
			return this.domLength?parseInt($(this.r.content).text().length*100/this.domLength):0;
		},
		testRichText:function(){
			var self = this;
			self.contestants = [];
			self.dom.find('p').each(function(){
				self.compute($(this));
			});
			
			self.elect();
		},
		compute:function($node, callback){
			//zc.log($node);
			var self = this;
			var attrs = {'tagname' : $node[0].tagName};
			var score = 0;
			$.each(self.opts.strategies, function(index, strategy){
				var sScore = strategy.score;
				var sRegex = strategy.regex;
				var sTypes = strategy.types;
				for(var k=0, kCeil=sTypes.length; k<kCeil; k++){
					var sType = sTypes[k];
					if(!attrs[sType]){
						attrs[sType] = $node.attr(sType)?$node.attr(sType):'';
					}
					if(attrs[sType] && sRegex.test(attrs[sType])){
						score += sScore;
					}
				}
			});
			var length = $node.text().length;
			if(length>10){
				score += length;
			}
			$node.attr('score', score);
			
			self.vote($node.parent(), score);
		},
		vote:function($np, score){
			var pScore = ($np.attr('score')?parseInt($np.attr('score')):0)+score;
			$np.attr('score', pScore);
			var vid = $np.attr('rvsid');
			if(vid){
				this.contestants[vid] = [$np, pScore];
			}else{
				vid = this.contestants.length;
				$np.attr('rvsid', vid);
				this.contestants[vid] = [$np, pScore];
			}
		},
		elect:function(){
			var self = this;
			var mIndex = -1;
			for(var i=0, len=this.contestants.length; i<len; i++){
				if(mIndex==-1 || this.contestants[mIndex][1]<this.contestants[i][1]){
					mIndex = i;
				}
			}
			if(mIndex>-1){
				self.r = {
					title:($(document).find('title').text()),
					content:(self.dealImg($(self.contestants[mIndex][0])[0].outerHTML)),
					link:window.location.href,
					status:1
				};
			}else{
				self.r = {
					title:$(document).find('title').text(),
					content:'sorry, readable.js found nothing in this page, email to wukezhan(at)gmail.com if you have any question.',
					link:window.location.href,
					status:0
				};
			}
		},
		dealImg:function(html){
			var self = this;
			var $content = $(html);
			var urlBase = window.location.origin+window.location.pathname;
			$content.find('img').each(function(){
				var $img = $(this);
				var src = $img.attr('src');
				if(!/^https?:\/\//.test(src)){
					src = urlBase+src;
					$img.attr('src', src);
				}
			});
			return $content.html();
		}
	};
	Readable.fn = Readable.prototype;
	
	window.Readable = Readable;
	
	$.fn.readable = function(opt){
		return this.each(function(){
			var ra = new Readable(this, opt);
			var r = ra.test();
			if(r.status){
				opt.success && opt.success.call(this, r, ra);
			}else{
				opt.error && opt.error.call(this, r, ra);
			}
		});
	};
	
})(jQuery||Zepto);