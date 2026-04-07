// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_swift_nightmare.sql';
import m0001 from './0001_aberrant_catseye.sql';
import m0002 from './0002_worried_the_stranger.sql';
import m0003 from './0003_wakeful_tenebrous.sql';

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
    m0003
  }
}
