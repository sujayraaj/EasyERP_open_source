define([
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/ChartOfAccount/list/ListHeader.html',
    'text!templates/ChartOfAccount/list/ListTemplate.html',
    'text!templates/ChartOfAccount/list/cancelEdit.html',
    'views/ChartOfAccount/CreateView',
    'views/ChartOfAccount/list/ListItemView',
    'collections/ChartOfAccount/filterCollection',
    'collections/ChartOfAccount/editCollection',
    'models/chartOfAccount'
], function ($, _, ListViewBase, listHeaderTemplate, listTemplate, cancelEdit, CreateView, ListItemView, ContentCollection, EditCollection, CurrentModel) {
    'use strict';

    var ProjectsListView = ListViewBase.extend({
        el               : '#content-holder',
        contentType      : 'ChartOfAccount',
        listTemplate     : listTemplate,
        ListItemView     : ListItemView,
        EditCollection   : EditCollection,
        CurrentModel     : CurrentModel,
        ContentCollection: ContentCollection,
        changedModels    : {},

        events: {
            'click td.editable'                                : 'editRow',
            'change .editable'                                 : 'setEditable',
            'keydown input.editing '                           : 'keyDown',
            'click .newSelectList li:not(.miniStylePagination)': 'chooseOption'
        },

        initialize: function (options) {
            $(document).off('click');

            this.CreateView = CreateView;

            this.startTime = options.startTime;
            this.collection = options.collection;
            this.parrentContentId = options.collection.parrentContentId;
            this.sort = options.sort;
            this.filter = options.filter;
            this.page = options.collection.currentPage;
            this.ContentCollection = ContentCollection;

            this.render();
        },

        chooseOption: function (e) {
            var target = $(e.target);
            var targetElement = target.parents('td');
            var tr = target.parents('tr');
            var modelId = tr.attr('data-id');
            var attr = targetElement.data('content');
            var changedAttr;

            var editModel = this.editCollection.get(modelId) || this.collection.get(modelId);

            if (!this.changedModels[modelId]) {
                if (!editModel.id) {
                    this.changedModels[modelId] = editModel.attributes;
                } else {
                    this.changedModels[modelId] = {};
                }
            }

            changedAttr = this.changedModels[modelId];
            if (attr === 'accountType') {

                changedAttr.accountType = target.text();
            }

            targetElement.text(target.text());

            this.hideNewSelect();
            this.setEditable(targetElement);

            return false;
        },

        setChangedValueToModel: function () {
            var editedElement = this.$el.find('.editing');
            var editedCol;
            var editedElementRowId;
            var editedElementContent;
            var editedElementValue;

            if (editedElement.length) {
                editedCol = editedElement.closest('td');
                editedElementRowId = editedElement.closest('tr').data('id');
                editedElementContent = editedCol.data('content');
                editedElementValue = editedElement.val();

                if (!this.changedModels[editedElementRowId]) {
                    this.changedModels[editedElementRowId] = {};
                }

                this.changedModels[editedElementRowId][editedElementContent] = editedElementValue;

                if (editedElementContent === 'code') {
                    editedElementValue = parseInt(editedElementValue, 10);

                    if (isNaN(editedElementValue)) {
                        editedCol.addClass('errorContent');
                        editedElementValue = '';
                    } else {
                        editedCol.removeClass('errorContent');
                    }
                }

                this.changedModels[editedElementRowId][editedElementContent] = editedElementValue;

                editedCol.text(editedElementValue);
                editedElement.remove();
            }
        },

        saveItem: function () {
            var model;
            var code;
            var account;
            var id;
            var errors = this.$el.find('.errorContent');

            for (id in this.changedModels) {
                model = this.editCollection.get(id) || this.collection.get(id);
                if (model) {
                    model.changed = this.changedModels[id];
                    code = this.changedModels[id].code || model.get('code');
                    account = this.changedModels[id].account || model.get('account');
                    model.changed.name = code + ' ' + account;
                }
            }

            if (errors.length) {
                return;
            }
            this.editCollection.save();

            for (id in this.changedModels) {
                delete this.changedModels[id];
                this.editCollection.remove(id);
            }

            this.deleteEditable();
        },

        render: function () {
            var self = this;
            var currentEl;
            var template = _.template(listTemplate);
            currentEl = this.$el;

            currentEl.html('');
            currentEl.html(_.template(listHeaderTemplate));
            currentEl.find('#chartOfAccount').html(template({
                collection: this.collection.toJSON()
            }));

            this.hideSaveCancelBtns();

            setTimeout(function (){
                self.bindingEventsToEditedCollection(self);
            }, 10);

            return this;
        }
    });

    return ProjectsListView;
});
