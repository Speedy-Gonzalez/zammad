# Copyright (C) 2012-2014 Zammad Foundation, http://zammad-foundation.org/

require 'digest/md5'

class Store < ApplicationModel
  store       :preferences
  belongs_to  :store_object,          :class_name => 'Store::Object'
  belongs_to  :store_file,            :class_name => 'Store::File'
  validates   :filename,              :presence => true

  def self.add(data)
    data = data.stringify_keys

    # lookup store_object.id
    store_object = Store::Object.create_if_not_exists( :name => data['object'] )
    data['store_object_id'] = store_object.id

    # check if record already exists
    #    store = Store.where( :store_object_id => store_object.id, :o_id => data['o_id'],  ).first
    #    if store != nil
    #      return store
    #    end

    # check real store
    md5 = Digest::MD5.hexdigest( data['data'] )
    data['size'] = data['data'].to_s.bytesize

    file = Store::File.where( :md5 => md5 ).first

    # store attachment
    if file == nil
      file = Store::File.create(
        :data => data['data'],
        :md5  => md5
      )
    end

    data['store_file_id'] = file.id

    # not needed attributes
    data.delete('data')
    data.delete('object')

    # store meta data
    store = Store.create(data)

    return store
  end

  def self.list(data)
    # search
    store_object_id = Store::Object.lookup( :name => data[:object] )
    stores = Store.where( :store_object_id => store_object_id, :o_id => data[:o_id].to_i ).
    order('created_at ASC, id ASC')
    return stores
  end

  def self.remove(data)
    # search
    store_object_id = Store::Object.lookup( :name => data[:object] )
    stores = Store.where( :store_object_id => store_object_id ).
    where( :o_id => data[:o_id] ).
    order('created_at ASC, id ASC')
    stores.each do |store|
      store.destroy
    end
    return true
  end

  class Object < ApplicationModel
    validates :name, :presence => true
  end

  class File < ApplicationModel
    before_validation :add_md5

    private
    def add_md5
      self.md5 = Digest::MD5.hexdigest( self.data )
    end
  end

end
