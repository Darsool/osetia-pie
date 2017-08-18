
jQuery(document).ready(function($) {


	$('.toggle-mnu').on('click', function(event) {
	  event.preventDefault();
	    if($(this).hasClass('on')){
	      $('.menu_top').removeAttr('style');
	    }else{
	      $('.menu_top').height($('body').height() - $('.menu_top').height() + 29);
	    }
	    $(this).add('.menu_top').toggleClass('on');
	});

	  $("#lightSlider").lightSlider({
	    item:4,
	    loop:false,
	    slideMove:1,
	    pager: false,
	    easing: 'cubic-bezier(0.25, 0, 0.25, 1)',
	    speed:600,
	  });

	$("#phone-input").mask("+7 (999) 999-99-99?");
	

	var importantField = $('.important-field');

	if (importantField.first().length) {

		importantField.find('input').on('blur', function(event) {
			event.preventDefault();
			var
				$this = $(this),
				$parent = $this.closest('.important-field'),
				$span = $parent.find('span');

			
			if($this.val() === ''){
				$span.addClass('notset');
				$this.addClass('notset');
			}else {
				$span.removeClass('notset');
				$this.removeClass('notset');

			}
		});

		importantField.find('input').on('keyup blur', function(event) {
			var setValue = false;
			importantField.find('input').each(function(index, el) {
				
				if($(el).val() == ''){
					setValue = false;
					return false;
				}else {
					setValue = true;
				}
			});			

			if(setValue){
				$('.oder_btn__oder').removeAttr('disabled');
		    } else {
		        $('.oder_btn__oder').attr('disabled', 'disabled');
		    }
		});


	}


});