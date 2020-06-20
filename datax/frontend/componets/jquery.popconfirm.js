/*!
 * PopConfirm 0.4.5
 * http://ifnot.github.io/PopConfirm/
 *
 * Use jQuery & Bootstrap
 * http://jquery.com/
 * http://getbootstrap.com/
 *
 * Copyright 2014 Anael Favre and other contributors
 * Released under the MIT license
 * https://raw.github.com/AnaelFavre/PopConfirm/master/LICENCE
 *
 * Thanks to contributors :
 * Thomas Hanson https://github.com/diresquirrel
 * Mohamed Aymen https://github.com/kernel64
 * Muhammad Ubaid Raza https://github.com/mubaidr
 */

(function ($) {
  'use strict';
  /*global jQuery, $*/
  /*jslint nomen: true, evil: true*/
  var data;
  var result;
  $.fn.extend({
    popConfirm: function (options) {
      var defaults = {
          title: '   消息系统    ',
          content: '__________________________________',
          placement: 'bottom',
          container: 'body',
          yesBtn: 'Yes',
          noBtn: 'No'
        },
        last = null;
      options = $.extend(defaults);
      return this.each(function () {
        var self = $(this),
          arrayActions = [],
          arrayDelegatedActions = [],
          eventToConfirm,
          optName,
          optValue,
          i,
          elmType,
          code,
          form;

        // Load data-* attriutes
        // for (optName in options) {
        //   if (options.hasOwnProperty(optName)) {
        //     optValue = $(this).attr('data-confirm-' + optName);
        //     if (optValue) {
        //       options[optName] = optValue;
        //     }
        //   }
        // }

        // If there are jquery click events
        // if (jQuery._data(this, "events") && jQuery._data(this, "events").click) {
        //
        //   // Save all click handlers
        //   for (i = 0; i < jQuery._data(this, "events").click.length; i = i + 1) {
        //     arrayActions.push(jQuery._data(this, "events").click[i].handler);
        //   }
        //
        //   // unbind it to prevent it firing
        //   $(self).unbind("click");
        // }

        // If there are jquery delegated click events
        // if (self.data('remote') && jQuery._data(document, "events") && jQuery._data(document, "events").click) {
        //
        //   // Save all delegated click handlers that apply
        //   for (i = 0; i < jQuery._data(document, "events").click.length; i = i + 1) {
        //     elmType = self[0].tagName.toLowerCase();
        //     if (jQuery._data(document, "events").click[i].selector && jQuery._data(document, "events").click[i].selector.indexOf(elmType + "[data-remote]") !== -1) {
        //       arrayDelegatedActions.push(jQuery._data(document, "events").click[i].handler);
        //     }
        //   }
        // }

        // If there are hard onclick attribute
        // if (self.attr('onclick')) {
        //   // Extracting the onclick code to evaluate and bring it into a closure
        //   code = self.attr('onclick');
        //   arrayActions.push(function () {
        //     eval(code);
        //   });
        //   $(self).prop("onclick", null);
        // }

        // If there are href link defined
        // if (!self.data('remote') && self.attr('href')) {
        //   // Assume there is a href attribute to redirect to
        //   arrayActions.push(function () {
        //     window.location.href = self.attr('href');
        //   });
        // }

        // If the button is a submit one
        // if (self.attr('type') && self.attr('type') === 'submit') {
        //   // Get the form related to this button then store submiting in closure
        //   form = $(this).parents('form:first');
        //   arrayActions.push(function () {
        //     // Add the button name / value if specified
        //     if(typeof self.attr('name') !== "undefined") {
        //       $('<input type="hidden">').attr('name', self.attr('name')).attr('value', self.attr('value')).appendTo(form);
        //     }
        //     form.submit();
        //   });
        // }

        self.popover({

          trigger: 'manual',
          title: options.title,
          html: true,
          placement: options.placement,
          container: options.container,
          //Avoid using multiline strings, no support in older browsers.
          content: options.content + '<p class="button-group" style="margin-top: 0px; text-align: center;" id="message"></p>'
        }).mouseover(function (e) {
          $.ajax({
          type: 'GET',
          url: "/api/dash/get_Unread_msg_info",
          data: {},
          success:function (data) {
              var url = ''
           result =  data.ordinary_msg
              $.each(result,function (k,v) {

                  url = "<a href='/dashboard/msgcenter?id="+ v.id + "&mark=1'>" + v.mail_title + "</a><br/>"
                  $("#message").append(url)
              })
              $("#message").append("<br/><br/><a id='set_read' style='float: right'>全部设为已读</a>")


          }

      })
          if (last && last !== self) {
            last.popover('hide').removeClass('popconfirm-active');
          }
          last = self;
        });
$("#set_read").on("click",function(){
                  $.ajax({
                      type: 'POST',
                      url: "/api/dash/set_read?num=0",
                      data: {},
                      //  新增content-type头部属性
                        heads : {
                            'content-type' : 'application/x-www-form-urlencoded'
                        },
                      success:function (data) {
                          alert('111')
                          location.reload();
                      }
                  })
              })
        $(document).on('click', function () {
          if (last) {
            last.popover('hide').removeClass('popconfirm-active');
          }
        });

        self.bind('mouseover', function (e) {
          eventToConfirm = e;

          e.preventDefault();
          e.stopPropagation();

          $('.popconfirm-active').not(self).popover('hide').removeClass('popconfirm-active');
          self.popover('show').addClass('popconfirm-active');

          $(document).find('.popover .confirm-dialog-btn-confirm').one('mouseover', function (e) {
            for (i = 0; i < arrayActions.length; i = i + 1) {
              arrayActions[i].apply(self, [eventToConfirm]);
            }

            for (i = 0; i < arrayDelegatedActions.length; i = i + 1) {
              arrayDelegatedActions[i].apply(self, [eventToConfirm.originalEvent]);
            }

            self.popover('hide').removeClass('popconfirm-active');
          });
          $(document).find('.popover .confirm-dialog-btn-abord').bind('mouseover', function (e) {
            self.popover('hide').removeClass('popconfirm-active');
          });
        });
      });
    }

  });

}(jQuery));
