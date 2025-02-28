class App.SearchableAjaxSelect extends App.SearchableSelect
  constructor: ->
    super

    # create cache
    @searchResultCache = {}

  render: ->
    if not _.isEmpty(@attribute.value) and not @attribute.multiple
      @attribute.options = [] if not _.isArray(@attribute.options)

      if @attribute.relation
        if App[@attribute.relation] && App[@attribute.relation].exists(@attribute.value)
          displayName = App[@attribute.relation].find(@attribute.value).displayName()
          @attribute.options.push({ value: @attribute.value, name: displayName, selected: true })
      else
        @attribute.options.push({ value: @attribute.value, name: @attribute.valueName or @attribute.value, selected: true })

    super

  objectString: =>
    # convert requested object
    # e.g. Ticket to ticket or AnotherObject to another_object
    return underscored(@options.attribute.relation)

  cacheKey: =>
    objectString = @objectString()
    query        = @input.val()

    # create cache key
    return "#{objectString}+#{query}"

  ajaxAttributes: =>
    objectString = @objectString()
    query        = @input.val()
    cacheKey     = @cacheKey()

    {
      id:   @options.attribute.id
      type: 'POST'
      url:  "#{App.Config.get('api_path')}/search/#{objectString}"
      data: JSON.stringify(query: query, limit: @options.attribute.limit)
      processData: true
      success:     (data, status, xhr) =>
        # cache search result
        @searchResultCache[cacheKey] = data
        @renderResponse(data, query)
    }

  onInput: (event) =>
    super

    query    = @input.val()
    cacheKey = @cacheKey()

    # use cache for search result
    if @searchResultCache[cacheKey]
      App.Ajax.abort @options.attribute.id
      @renderResponse @searchResultCache[cacheKey], query
      return

    # add timeout for loader icon
    if !@loaderTimeoutId
      @loaderTimeoutId = setTimeout @showLoader, 1000

    attributes = @ajaxAttributes()

    # if delegate is given and provides getAjaxAttributes method, try to extend ajax call
    # this is needed for autocompletion field in KB answer-to-answer linking to submit search context
    if @delegate?.getAjaxAttributes
      attributes = @delegate?.getAjaxAttributes?(@, attributes)

    # start search request and update options
    App.Ajax.request(attributes)

  renderResponse: (data, originalQuery) =>
    # clear timout and remove loader icon
    clearTimeout @loaderTimeoutId
    @loaderTimeoutId = undefined
    @el.removeClass('is-loading')

    # load assets
    App.Collection.loadAssets(data.assets)

    # get options from search result
    options = data
      .result
      .map (elem) =>
        # use search results directly to avoid loading KB assets in Ticket view
        if @useAjaxDetails
          @renderResponseItemAjax(elem, data)
        else
          @renderResponseItem(elem)
      .filter (elem) -> elem?

    # fill template with gathered options
    @optionsList.html @renderOptions options

    # refresh elements
    @refreshElements()

  renderResponseItemAjax: (elem, data) ->
    result = _.find(data.details, (detailElem) -> detailElem.type == elem.type and detailElem.id == elem.id)

    category = undefined
    if result.type is 'KnowledgeBase::Answer::Translation' && result.subtitle
      category = result.subtitle
    if result
      {
        category: category
        name:     result.title
        value:    elem.id
      }

  renderResponseItem: (elem) ->
    object = App[elem.type.replace(/::/g, '')]?.find(elem.id)

    if !object
      return

    name = if object instanceof App.Ticket
             "##{object.number} - #{object.title}"
           else
             object.displayName()

    {
      name:  name
      value: object.id
      inactive: object.active == false
    }

  showLoader: =>
    @el.addClass('is-loading')
