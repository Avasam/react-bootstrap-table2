/* eslint no-return-assign: 0 */
/* eslint react/prop-types: 0 */
import React, { Component } from 'react';
import Store from './store';

import {
  wrapWithCellEdit,
  wrapWithSelection,
  wrapWithFilter,
  wrapWithSort,
  wrapWithPagination
} from './table-factory';

import remoteResolver from './props-resolver/remote-resolver';
import _ from './utils';

const withDataStore = Base =>
  class BootstrapTableContainer extends remoteResolver(Component) {
    constructor(props) {
      super(props);
      this.store = new Store(props.keyField);
      this.store.data = props.data;
      this.handleUpdateCell = this.handleUpdateCell.bind(this);
    }

    componentWillReceiveProps(nextProps) {
      this.store.data = nextProps.data;
    }

    handleUpdateCell(rowId, dataField, newValue) {
      const { cellEdit } = this.props;
      // handle cell editing internal
      if (!cellEdit.onUpdate) {
        this.store.edit(rowId, dataField, newValue);
        return true;
      }

      // handle cell editing external
      const aPromise = cellEdit.onUpdate(rowId, dataField, newValue);
      if (_.isDefined(aPromise) && aPromise !== false) { // TODO: should be a promise here
        aPromise.then((result = true) => {
          const response = result === true ? {} : result;
          if (_.isObject(response)) {
            const { value } = response;
            this.store.edit(rowId, dataField, value || newValue);
            this.cellEditWrapper.completeEditing();
          }
        }).catch((e) => {
          this.cellEditWrapper.updateEditingWithErr(e.message);
        });
      }
      return false;
    }

    render() {
      const baseProps = {
        ...this.props,
        store: this.store
      };

      if (this.props.cellEdit) {
        return wrapWithCellEdit({
          ref: node => this.cellEditWrapper = node,
          onUpdateCell: this.handleUpdateCell,
          ...baseProps
        });
      } else if (this.props.selectRow) {
        return wrapWithSelection(baseProps);
      } else if (this.props.filter) {
        return wrapWithFilter({
          ...baseProps,
          onRemoteFilterChange: this.handleRemoteFilterChange,
          onRemotePageChange: this.handleRemotePageChange
        });
      } else if (this.props.columns.filter(col => col.sort).length > 0) {
        return wrapWithSort(baseProps);
      } else if (this.props.pagination) {
        return wrapWithPagination({
          ...baseProps,
          onRemotePageChange: this.handleRemotePageChange
        });
      }

      return React.createElement(Base, baseProps);
    }
  };

export default withDataStore;
