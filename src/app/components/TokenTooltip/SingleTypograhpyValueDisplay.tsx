import React from 'react';
import { SingleTypographyToken } from '@/types/tokens';
import Box from '../Box';

// @TODO confirm whether the typography token values
// can still have the .value property from legacy

type Props = {
  value: SingleTypographyToken['value']
  shouldResolve: boolean
};

export const SingleTypographyValueDisplay: React.FC<Props> = ({ value, shouldResolve }) => (
  <Box css={{ color: '$fgToolTipMuted' }}>
    <div>
      Font:
      {' '}
      {value.fontFamily?.value || value.fontFamily}
    </div>
    <div>
      Weight:
      {' '}
      {value.fontWeight?.value || value.fontWeight}
    </div>
    <div>
      Size:
      {' '}
      {value.fontSize?.value || value.fontSize}
    </div>
    <div>
      Leading:
      {' '}
      {value.lineHeight?.value || value.lineHeight}
    </div>
    <div>
      Tracking:
      {' '}
      {value.letterSpacing?.value || value.letterSpacing}
    </div>
    <div>
      Paragraph Spacing:
      {' '}
      {value.paragraphSpacing?.value || value.paragraphSpacing}
    </div>
    <div>
      Text Case:
      {' '}
      {value.textCase?.value || value.textCase}
    </div>
    <div>
      Text Decoration:
      {' '}
      {value.textDecoration?.value || value.textDecoration}
    </div>
    {
        shouldResolve && (
        <Box css={{ color: '$fgToolTipMuted' }}>
          {value.fontFamily}
          {' '}
          {value.fontWeight}
          {' '}
          /
          {' '}
          {value.fontSize}
        </Box>
        )
      }
  </Box>
);
