/**
 * @author wukezhan
 * 
 */

;(function($){
    var defaults = {
        wrapper:document,
        slideOn:'select',
        slideOff:'',
        keyOn:'select',
        keyOff:'',
        speed:'fast',
        loop:true,
        interval:3000,
        keyEvents:{
            mouseover:function(ZS){
                if(parseInt($(this).data('zslides.index')) == ZS.index){
                    ZS.pause();
                }else{
                    ZS.play(parseInt($(this).data('zslides.index')), function(){
                        ZS.pause();
                    });
                }
            }
        },
        slideEvents:{},
        show:function(){
            this.slides.eq(this.prevIndex)
                .stop(false, true)
                .fadeOut(this.opts.speed)
                .removeClass(this.opts.slideOn)
                .addClass(this.opts.slideOff);
            this.keys.length && this.keys.eq(this.prevIndex).removeClass(this.opts.keyOn);
            
            this.slides.eq(this.index)
                .stop(false, true)
                .addClass(this.opts.slideOn)
                .fadeIn(this.opts.speed);
            this.keys.length && this.keys.eq(this.index).removeClass(this.opts.keyOff).addClass(this.opts.keyOn);
        }
    };
    function Z_Slides(opts){
        var self = this;
        this.opts = $.extend({}, defaults, opts);
        var $wrapper = $(this.opts.wrapper);
        this.slides = $(this.opts.slides, $wrapper);
        this.keys = this.opts.keys?$(this.opts.keys, $wrapper):null;

        this.maxIndex = this.slides.length-1;
        this.prevIndex = 0;
        this.index = 0;
        this.nextIndex = 0;

        this.loop = this.opts.loop;
        this.interval = this.opts.interval;
        this.timer = null;
        this.halt = false;

        this.init();

        if(this.opts.autoplay){
            this.autoplay();
        }
    }
    Z_Slides.prototype = {
        init:function(){
            var ZS = this;
            this.slides.parent().css({position:'relative'});
            this.slides.css({position:'absolute', top:0, left:0});
            
            if (this.keys){
                var _index = 0;
                this.keys.each(function(){
                    $(this).data('zslides.index', _index++);
                });
                for(var ev in ZS.opts.keyEvents){
                    this.keys.bind(ev, function(){
                        ZS.opts.keyEvents[ev].call(this, ZS);
                    });
                }
            }
            
            if (this.slides.length){
                var _index = 0;
                ZS.slides.each(function(){
                    var slide = $(this).data('zslides.index', _index++);
                    for(var ev in ZS.opts.slideEvents){
                        slide.bind(ev, function(){
                            ZS.opts.slideEvents[ev].call(this, ZS);
                        });
                    }
                });
            }
            ('function' == typeof this.opts.init ) && this.opts.init.call(this);
        },
        show:function(){
            this.opts.beforeShow && this.opts.beforeShow.call(this);
            this.opts.show.call(this);
            this.opts.afterShow && this.opts.afterShow.call(this);
        },
        play: function(index, callback){
            var ZS = this;
            this.timer && clearTimeout(this.timer);
            this.prevIndex = this.index;
            this.index = index;
            this.show();
            callback && callback.call(this);
            if(!this.halt && this.opts.autoplay){
                this.timer = setTimeout(function(){
                    ZS.next();
                }, this.interval);
            }
        },
        pause: function(){
            this.timer && clearTimeout(this.timer);
            this.halt = true;
        },
        restart: function(){
            var ZS = this;
            this.halt = false;
            this.timer = setTimeout(function(){
                ZS.next();
            }, this.interval);
        },
        prev: function(){
            var prev = this.index>1?this.index-1:(this.loop?this.maxIndex:0);
            this.play(prev);
        },
        next: function(){
            var next = this.index>=this.maxIndex?(this.loop?0:this.maxIndex): this.index+1;
            this.play(next);
        },
        autoplay: function(){
            var ZS = this;
            this.timer = setTimeout(function(){
                ZS.next();
            }, this.interval);
        }
    };
    
    //export to jquery
    $.fn.zslides = function(opts){
    	return this.each(function(){
    		opts.wrapper = this;
    		this.zslides = new Z_Slides(opts);
    	});
    };
})(jQuery||Zepto);
