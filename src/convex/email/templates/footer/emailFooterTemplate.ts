// CONFIG
import { COMPANY_DATA } from '@/shared/constants.js';

// SHARED
import { EMAIL_THEME } from '../shared';
import { t } from '@/convex/i18n';

/**
 * Closing half of every email: closes the content cell opened by {@link emailHeaderTemplate},
 * then renders the footer row (contact + copyright) and closes the card, canvas and document.
 */
export function emailFooterTemplate(locale: string): string {
	const year = new Date().getFullYear();

	return `</td></tr>
<tr><td style="padding:20px 32px;background:#fafafa;border-top:1px solid ${EMAIL_THEME.border};">
<p style="margin:0;font-size:12px;line-height:1.6;color:${EMAIL_THEME.muted};">
${COMPANY_DATA.NAME} · <a href="mailto:${COMPANY_DATA.EMAIL}" style="color:${EMAIL_THEME.muted};text-decoration:underline;">${COMPANY_DATA.EMAIL}</a>
</p>
<p style="margin:6px 0 0;font-size:12px;color:${EMAIL_THEME.muted};">© ${year} ${COMPANY_DATA.NAME}. ${t(locale, 'footer.allRightsReserved')}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
