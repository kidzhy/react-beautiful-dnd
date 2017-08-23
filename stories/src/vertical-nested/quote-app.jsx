// @flow
import React, { Component } from 'react';
import styled, { injectGlobal } from 'styled-components';
import { action } from '@storybook/addon-actions';
import { DragDropContext } from '../../../src/';
import { colors, grid } from '../constants';
import QuoteList from './quote-list';
import reorder from '../reorder';
import { getQuotes } from '../data';
import type { Quote } from '../types';
import type { NestedQuoteList } from './types';
import type { DropResult, DragStart } from '../../../src/types';

const quotes: Quote[] = getQuotes(10);

const initialList: NestedQuoteList = {
  id: 'first-level',
  title: 'top level',
  children: [
    ...quotes.slice(0, 2),
    {
      id: 'second-level',
      title: 'second level',
      children: quotes.slice(3, 5),
    },
    ...quotes.slice(6, 9),
  ],
};

const publishOnDragStart = action('onDragStart');
const publishOnDragEnd = action('onDragEnd');

const Root = styled.div`
  background-color: ${colors.blue.deep};
  box-sizing: border-box;
  padding: ${grid * 2}px;
  min-height: 100vh;

  /* flexbox */
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const isDraggingClassName = 'is-dragging';

type State = {|
  list: NestedQuoteList,
|}

export default class QuoteApp extends Component {
  /* eslint-disable react/sort-comp */
  state: State

  state: State = {
    list: initialList,
  };
  /* eslint-enable */

  onDragStart = (initial: DragStart) => {
    publishOnDragStart(initial);
    // $ExpectError - body could be null?
    document.body.classList.add(isDraggingClassName);
  }

  onDragEnd = (result: DropResult) => {
    publishOnDragEnd(result);
    // $ExpectError - body could be null?
    document.body.classList.remove(isDraggingClassName);

    // dropped outside the list
    if (!result.destination) {
      return;
    }

    if (result.type === 'first-level') {
      const children = reorder(
        this.state.list.children,
        result.source.index,
        result.destination.index,
      );

      // $ExpectError - using spread
      const list: NestedQuoteList = {
        ...this.state.list,
        children,
      };

      this.setState({
        list,
      });
      return;
    }

    if (result.type === 'second-level') {
      // $ExpectError - item only has the children property if it is a NestedQuoteList
      const nested: ?NestedQuoteList = this.state.list.children.filter(
        // $ExpectError - item only has the children property if it is a NestedQuoteList
        (item: Quote | NestedQuoteList): boolean => item.children != null
      )[0];

      if (!nested) {
        console.error('could not find nested list');
        return;
      }

      // $ExpectError - using spread
      const updated: NestedQuoteList = {
        ...nested,
        children: reorder(
          nested.children,
          result.source.index,
          result.destination.index,
        ),
      };

      const nestedIndex = this.state.list.children.indexOf(nested);
      const children = Array.from(this.state.list.children);
      children[nestedIndex] = updated;

      // $ExpectError - using spread
      const list: NestedQuoteList = {
        ...this.state.list,
        children,
      };

      this.setState({
        list,
      });
    }
  }

  componentDidMount() {
    // eslint-disable-next-line no-unused-expressions
    injectGlobal`
      body.${isDraggingClassName} {
        cursor: grabbing;
        user-select: none;
      }
    `;
  }

  render() {
    const { list } = this.state;

    return (
      <DragDropContext
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
      >
        <Root>
          <QuoteList list={list} />
        </Root>
      </DragDropContext>
    );
  }
}
