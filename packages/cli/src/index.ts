import { cac } from 'cac'
import { registerImportCommand } from './import-command'
import { registerGovernLinksCommand } from './govern-links-command'
import { registerAutomationCommands } from './automation-commands'

const cli = cac('momei')

registerImportCommand(cli)
registerGovernLinksCommand(cli)
registerAutomationCommands(cli)

cli.help()
cli.version('1.0.0')

cli.parse()
