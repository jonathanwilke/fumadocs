'use client';

import { useDocsSearch } from 'fumadocs-core/search/client';
import { type ReactNode, useState } from 'react';
import { useI18n } from '@/contexts/i18n';
import {
  SearchDialog,
  type SharedProps,
  type TagItem,
  TagsList,
} from './search';

export interface DefaultSearchDialogProps extends SharedProps {
  /**
   * Search tag
   *
   * @deprecated Use Tags API instead
   */
  tag?: string;

  defaultTag?: string;
  tags?: TagItem[];

  /**
   * Search API URL
   */
  api?: string;

  /**
   * The debounced delay for performing a search.
   */
  delayMs?: number;

  footer?: ReactNode;
}

export default function DefaultSearchDialog({
  defaultTag,
  tags,
  api,
  delayMs,
  ...props
}: DefaultSearchDialogProps): React.ReactElement {
  const { locale } = useI18n();
  const [tag, setTag] = useState<string>();
  const { search, setSearch, query } = useDocsSearch(locale, tag, api, delayMs);

  return (
    <SearchDialog
      search={search}
      onSearchChange={setSearch}
      results={query.data ?? []}
      {...props}
      footer={
        <>
          {tags ? (
            <TagsList
              tag={tag ?? defaultTag}
              onTagChange={setTag}
              items={tags}
            />
          ) : null}
          {props.footer}
        </>
      }
    />
  );
}
